// ===========================================================
// POST /.netlify/functions/webhook
// Reçoit les événements Stripe. Sur un paiement réussi :
//  - transforme le hold "pending" en réservation "confirmed"
//  - envoie une notification (si NOTIFY_WEBHOOK_URL est configurée)
//
// À déclarer dans le Dashboard Stripe → Développeurs → Webhooks
// avec l'URL : https://votredomaine.fr/.netlify/functions/webhook
// et l'événement : checkout.session.completed
// ===========================================================
const Stripe = require("stripe");
const { getStore } = require("@netlify/blobs");

exports.handler = async function (event) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers["stripe-signature"];

  let stripeEvent;
  try{
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  }catch(err){
    console.error("Signature webhook invalide:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === "checkout.session.completed"){
    const session = stripeEvent.data.object;
    const meta = session.metadata;

    const store = getStore("jolireve-bookings");
    let ranges = (await store.get("booked-ranges", { type: "json" })) || [];

    ranges = ranges.map(r => {
      if (r.holdId === meta.holdId){
        return {
          start: r.start,
          end: r.end,
          status: "confirmed",
          formula: meta.formula,
          guests: meta.guests,
          spaOption: meta.spaOption === "true",
          total: meta.total,
          deposit: meta.deposit,
          name: meta.name,
          email: meta.email,
          phone: meta.phone,
          message: meta.message,
          sessionId: session.id,
          confirmedAt: Date.now()
        };
      }
      return r;
    });

    await store.setJSON("booked-ranges", ranges);

    // Notification optionnelle (email, Slack, etc. via un service comme Make ou Zapier)
    if (process.env.NOTIFY_WEBHOOK_URL){
      try{
        await fetch(process.env.NOTIFY_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "nouvelle_reservation",
            formule: meta.formula,
            arrivee: meta.checkin,
            depart: meta.checkout,
            voyageurs: meta.guests,
            total: meta.total,
            acompte: meta.deposit,
            client: meta.name,
            email: meta.email,
            telephone: meta.phone,
            message: meta.message
          })
        });
      }catch(err){
        console.error("Notification échouée (non bloquant):", err.message);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
