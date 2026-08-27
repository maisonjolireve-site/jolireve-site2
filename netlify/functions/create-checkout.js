// ===========================================================
// POST /.netlify/functions/create-checkout
// Reçoit les détails d'une demande de réservation, revérifie
// tout côté serveur (jamais confiance au prix envoyé par le
// navigateur), pose une réservation provisoire ("pending") le
// temps du paiement, puis crée une session Stripe Checkout
// pour l'acompte de 30 %.
//
// IMPORTANT : si vous modifiez les tarifs dans script.js,
// reportez le même changement ici (CONFIG ci-dessous).
// ===========================================================
const Stripe = require("stripe");
const { getStore } = require("@netlify/blobs");

const CONFIG = {
  depositRate: 0.30,
  cleaningFee: 120, // ménage fin de séjour, comme sur l'annonce Airbnb
  formulas: {
    intime: { label: "Version intime (2-6 pers.)", maxGuests: 6, priceWeekday: 140, priceWeekend: 160, spaIncluded: false },
    grand: { label: "Grand format (jusqu'à 10 pers.)", maxGuests: 10, priceWeekday: 380, priceWeekend: 400, spaIncluded: true }
  },
  spaPricing: [
    { nights: 2, price: 160 },
    { nights: 3, price: 210 },
    { nights: 4, price: 240 }
  ],
  spaExtraPerNight: 50,
  holdMinutes: 20 // durée pendant laquelle les dates sont réservées le temps du paiement
};

function countNights(checkin, checkout){
  return Math.round((new Date(checkout) - new Date(checkin)) / 86400000);
}

function computeStayPrice(checkinStr, checkoutStr, formulaKey){
  const f = CONFIG.formulas[formulaKey];
  let total = 0;
  const cursor = new Date(checkinStr + "T00:00:00");
  const end = new Date(checkoutStr + "T00:00:00");
  while (cursor < end){
    const day = cursor.getDay();
    const isWeekendNight = (day === 5 || day === 6);
    total += isWeekendNight ? f.priceWeekend : f.priceWeekday;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

function computeSpaPrice(nights){
  if (nights <= 1) return CONFIG.spaPricing[0].price;
  const tier = CONFIG.spaPricing.find(t => t.nights === nights);
  if (tier) return tier.price;
  if (nights > 4){
    const base = CONFIG.spaPricing[CONFIG.spaPricing.length - 1].price;
    return base + (nights - 4) * CONFIG.spaExtraPerNight;
  }
  return CONFIG.spaPricing[0].price;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd){
  return aStart < bEnd && bStart < aEnd;
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST"){
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  let payload;
  try{
    payload = JSON.parse(event.body);
  }catch{
    return { statusCode: 400, body: JSON.stringify({ error: "Requête invalide." }) };
  }

  const { formula, checkin, checkout, guests, spaOption, name, email, phone, message } = payload;

  // --- Validations de base ---
  const f = CONFIG.formulas[formula];
  if (!f) return { statusCode: 400, body: JSON.stringify({ error: "Formule inconnue." }) };
  if (!checkin || !checkout || new Date(checkout) <= new Date(checkin)){
    return { statusCode: 400, body: JSON.stringify({ error: "Dates de séjour invalides." }) };
  }
  if (!guests || guests < 1 || guests > f.maxGuests){
    return { statusCode: 400, body: JSON.stringify({ error: `Nombre de voyageurs invalide (max ${f.maxGuests}).` }) };
  }
  if (!name || !email || !phone){
    return { statusCode: 400, body: JSON.stringify({ error: "Merci de renseigner votre nom, email et téléphone." }) };
  }

  const store = getStore("jolireve-bookings");
  const now = Date.now();
  let ranges = (await store.get("booked-ranges", { type: "json" })) || [];

  // Purge les demandes provisoires expirées (paiement abandonné)
  ranges = ranges.filter(r => r.status !== "pending" || r.expiresAt > now);

  // Vérifie qu'aucune période ne chevauche une réservation confirmée ou en cours de paiement
  const conflict = ranges.some(r => rangesOverlap(checkin, checkout, r.start, r.end));
  if (conflict){
    await store.setJSON("booked-ranges", ranges); // sauvegarde la purge même en cas de conflit
    return { statusCode: 409, body: JSON.stringify({ error: "Ces dates viennent d'être réservées par quelqu'un d'autre. Merci de choisir une autre période." }) };
  }

  // --- Calcul du prix (source de vérité : le serveur) ---
  const nights = countNights(checkin, checkout);
  let total = computeStayPrice(checkin, checkout, formula);
  let spaPrice = 0;
  if (!f.spaIncluded && spaOption){
    spaPrice = computeSpaPrice(nights);
    total += spaPrice;
  }
  total += CONFIG.cleaningFee;
  const deposit = Math.round(total * CONFIG.depositRate);

  if (deposit < 1){
    return { statusCode: 400, body: JSON.stringify({ error: "Montant de séjour invalide." }) };
  }

  // --- Pose d'une réservation provisoire (évite le double-booking pendant le paiement) ---
  const holdId = `hold_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt = now + CONFIG.holdMinutes * 60 * 1000;
  ranges.push({ start: checkin, end: checkout, status: "pending", holdId, expiresAt });
  await store.setJSON("booked-ranges", ranges);

  // --- Création de la session Stripe Checkout ---
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const siteUrl = process.env.SITE_URL || `https://${event.headers.host}`;

  try{
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: deposit * 100,
          product_data: {
            name: `Acompte réservation Jolirêve — ${f.label}`,
            description: `${checkin} → ${checkout} (${nights} nuit${nights>1?"s":""}), ${guests} voyageur${guests>1?"s":""}${spaOption && !f.spaIncluded ? " · spa en option" : ""}`
          }
        },
        quantity: 1
      }],
      metadata: {
        holdId, formula, checkin, checkout, guests: String(guests),
        spaOption: String(!!spaOption), total: String(total), deposit: String(deposit),
        name, email, phone, message: message || ""
      },
      success_url: `${siteUrl}/reservation-confirmee.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/#reservation`
    });

    // On mémorise l'identifiant de session sur le hold, pour le retrouver depuis le webhook
    ranges = ranges.map(r => r.holdId === holdId ? { ...r, sessionId: session.id } : r);
    await store.setJSON("booked-ranges", ranges);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url })
    };
  }catch(err){
    console.error("Erreur Stripe:", err);
    // on retire le hold posé puisque le paiement n'a pas pu être initié
    ranges = ranges.filter(r => r.holdId !== holdId);
    await store.setJSON("booked-ranges", ranges);
    return { statusCode: 500, body: JSON.stringify({ error: "Impossible de préparer le paiement. Merci de réessayer dans un instant." }) };
  }
};
