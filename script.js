/* ===========================================================
   JOLIRÊVE — script principal
   Toute la configuration modifiable (prix, capacités, textes)
   est regroupée dans l'objet CONFIG ci-dessous.
   =========================================================== */

const CONFIG = {
  // Chemin des fonctions serveur (Netlify Functions).
  // Ne pas modifier sauf changement d'hébergeur.
  apiBase: "/.netlify/functions",

  depositRate: 0.30, // 30 % d'acompte
  cleaningFee: 120, // ménage fin de séjour, comme sur l'annonce Airbnb

  formulas: {
    intime: {
      label: "Version intime",
      maxGuests: 6,
      minGuests: 1,
      priceWeekday: 140, // €/nuit dimanche-jeudi
      priceWeekend: 160, // €/nuit vendredi-samedi
      spaIncluded: false
    },
    grand: {
      label: "Grand format",
      maxGuests: 10,
      minGuests: 1,
      priceWeekday: 380,
      priceWeekend: 400,
      spaIncluded: true
    }
  },

  // Tarif du spa en option (formule Intime uniquement), paliers par séjour
  spaPricing: [
    { nights: 2, price: 160 },
    { nights: 3, price: 210 },
    { nights: 4, price: 240 },
    // au-delà : 240 + 50 € par nuit supplémentaire
  ],
  spaExtraPerNight: 50,

  // Formatage monétaire
  currency: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
};

function euros(n){ return CONFIG.currency.format(n); }

/* ===========================================================
   GALERIE
   =========================================================== */
const GALERIE_PHOTOS = [
  // Extérieur & Détente
  { src: "images/spa-hero.jpeg", category: "exterieur", alt: "Cour en pierre et spa illuminé au crépuscule" },
  { src: "images/exterieur-table-soir-1.jpeg", category: "exterieur", alt: "Table dressée dehors sous les guirlandes lumineuses" },
  { src: "images/exterieur-brasero.jpeg", category: "exterieur", alt: "Espace brasero convivial dans la cour close" },
  { src: "images/exterieur-transats.jpeg", category: "exterieur", alt: "Espace transats et détente au soleil" },
  { src: "images/exterieur-babyfoot.jpeg", category: "exterieur", alt: "Baby-foot extérieur sous le préau" },

  // Spa de nage
  { src: "images/spa-10.jpeg", category: "spa", alt: "Grand spa de nage chauffé avec vue d'ensemble" },
  { src: "images/spa-5-jets.jpeg", category: "spa", alt: "Jets de massage et nage à contre-courant" },
  { src: "images/spa-14-bleu.jpeg", category: "spa", alt: "Ambiance nocturne éclairage LED bleu du spa" },

  // Séjour / Salon
  { src: "images/salon-mezzanine-1.jpeg", category: "salon", alt: "Grand séjour lumineux avec poutres apparentes" },
  { src: "images/salon-mezzanine-2.jpeg", category: "salon", alt: "Espace salon détente sur la mezzanine" },

  // Cuisine & Repas
  { src: "images/cuisine-table.jpeg", category: "cuisine", alt: "Grande table en chêne conviviale" },
  { src: "images/cuisine-3.jpeg", category: "cuisine", alt: "Piano de cuisson et cuisine équipée" },
  { src: "images/cuisine-detail.jpeg", category: "cuisine", alt: "Détails et vaisselle de caractère" },

  // Chambres & Salles d'eau
  { src: "images/chambre-1.jpeg", category: "chambres", alt: "Chambre parentale lumineuse et soignée" },
  { src: "images/chambre-2-tropical.jpeg", category: "chambres", alt: "Chambre double décoration chaleureuse" },
  { src: "images/chambre-dortoir-lits-superposes.jpeg", category: "chambres", alt: "Dortoir familial avec lits superposés" },
  { src: "images/salle-eau-douche-italienne.jpeg", category: "salle-eau", alt: "Salle d'eau moderne avec douche à l'italienne" },
  { src: "images/salle-eau-vasque.jpeg", category: "salle-eau", alt: "Meuble vasque et finitions soignées" }
];

function renderGallery(filter = "all"){
  const grid = document.getElementById("galerieGrid");
  grid.innerHTML = "";
  const items = GALLERY.filter(g => filter === "all" || g.cat === filter);
  items.forEach((g, i) => {
    const div = document.createElement("div");
    div.className = "g-item" + (g.size ? " " + g.size : "");
    const img = document.createElement("img");
    img.src = g.src;
    img.alt = g.alt;
    img.loading = "lazy";
    img.addEventListener("click", () => openLightbox(items, i));
    div.appendChild(img);
    grid.appendChild(div);
  });
}

let lightboxItems = [];
let lightboxIndex = 0;
function openLightbox(items, index){
  lightboxItems = items;
  lightboxIndex = index;
  updateLightbox();
  document.getElementById("lightbox").classList.add("open");
}
function updateLightbox(){
  const item = lightboxItems[lightboxIndex];
  const img = document.getElementById("lightboxImg");
  img.src = item.src;
  img.alt = item.alt;
}
document.getElementById("lightboxClose").addEventListener("click", () => {
  document.getElementById("lightbox").classList.remove("open");
});
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") document.getElementById("lightbox").classList.remove("open");
});
document.getElementById("lightboxPrev").addEventListener("click", () => {
  lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
  updateLightbox();
});
document.getElementById("lightboxNext").addEventListener("click", () => {
  lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
  updateLightbox();
});
document.addEventListener("keydown", (e) => {
  if (!document.getElementById("lightbox").classList.contains("open")) return;
  if (e.key === "Escape") document.getElementById("lightbox").classList.remove("open");
  if (e.key === "ArrowLeft") document.getElementById("lightboxPrev").click();
  if (e.key === "ArrowRight") document.getElementById("lightboxNext").click();
});

document.querySelectorAll(".filtre").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filtre").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderGallery(btn.dataset.filter);
  });
});

renderGallery();

/* ===========================================================
   NAVIGATION — effet au scroll
   =========================================================== */
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 60);
});

/* ===========================================================
   CALENDRIER DE RÉSERVATION
   =========================================================== */
const state = {
  formula: "intime",
  guests: 2,
  checkin: null,   // Date
  checkout: null,  // Date
  spaOption: false,
  bookedRanges: [], // [{start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'}, ...] récupéré depuis le serveur
  viewMonth: new Date().getMonth(),
  viewYear: new Date().getFullYear()
};

function toISO(d){ return d.toISOString().slice(0, 10); }

function isDateBooked(date){
  const iso = toISO(date);
  return state.bookedRanges.some(r => iso >= r.start && iso < r.end);
}

async function loadAvailability(){
  try{
    const res = await fetch(`${CONFIG.apiBase}/availability?formula=${state.formula}`);
    if (!res.ok) throw new Error("Réponse serveur invalide");
    const data = await res.json();
    state.bookedRanges = data.booked || [];
  }catch(err){
    // En l'absence du backend (site testé en local avant déploiement),
    // le calendrier reste utilisable mais sans blocage des dates déjà prises.
    console.warn("Disponibilités indisponibles pour le moment :", err.message);
    state.bookedRanges = [];
  }
  renderCalendar();
}

const MONTHS_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

function renderCalendar(){
  const grid = document.getElementById("calGrid");
  const label = document.getElementById("calMonthLabel");
  grid.innerHTML = "";
  label.textContent = `${MONTHS_FR[state.viewMonth]} ${state.viewYear}`;

  const first = new Date(state.viewYear, state.viewMonth, 1);
  const startOffset = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);

  for (let i = 0; i < startOffset; i++){
    const empty = document.createElement("div");
    empty.className = "cal-day cal-day--empty";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++){
    const date = new Date(state.viewYear, state.viewMonth, d);
    const cell = document.createElement("div");
    cell.className = "cal-day";
    cell.textContent = d;

    const isPast = date < today;
    const isBooked = isDateBooked(date);
    const isSelectedStart = state.checkin && toISO(date) === toISO(state.checkin);
    const isSelectedEnd = state.checkout && toISO(date) === toISO(state.checkout);
    const isInRange = state.checkin && state.checkout && date > state.checkin && date < state.checkout;

    if (isPast) cell.classList.add("cal-day--past");
    else if (isBooked) cell.classList.add("cal-day--booked");
    else cell.addEventListener("click", () => onDayClick(date));

    if (isSelectedStart || isSelectedEnd) cell.classList.add("cal-day--selected");
    else if (isInRange) cell.classList.add("cal-day--in-range");

    grid.appendChild(cell);
  }
}

function onDayClick(date){
  if (!state.checkin || (state.checkin && state.checkout)){
    // nouvelle sélection
    state.checkin = date;
    state.checkout = null;
  } else {
    if (date <= state.checkin){
      state.checkin = date;
      state.checkout = null;
    } else {
      // vérifier qu'aucune date réservée n'est comprise dans l'intervalle choisi
      let conflict = false;
      const cursor = new Date(state.checkin);
      while (cursor < date){
        if (isDateBooked(cursor)){ conflict = true; break; }
        cursor.setDate(cursor.getDate() + 1);
      }
      if (conflict){
        alert("Certaines dates de cette période sont déjà réservées. Merci de choisir un autre intervalle.");
        state.checkin = date;
        state.checkout = null;
      } else {
        state.checkout = date;
      }
    }
  }
  renderCalendar();
  updateRecap();
}

document.getElementById("calPrev").addEventListener("click", () => {
  state.viewMonth--;
  if (state.viewMonth < 0){ state.viewMonth = 11; state.viewYear--; }
  renderCalendar();
});
document.getElementById("calNext").addEventListener("click", () => {
  state.viewMonth++;
  if (state.viewMonth > 11){ state.viewMonth = 0; state.viewYear++; }
  renderCalendar();
});

/* ===========================================================
   FORMULE / VOYAGEURS / OPTION SPA
   =========================================================== */
document.querySelectorAll('input[name="formula"]').forEach(radio => {
  radio.addEventListener("change", (e) => {
    state.formula = e.target.value;
    const f = CONFIG.formulas[state.formula];
    if (state.guests > f.maxGuests) state.guests = f.maxGuests;
    document.getElementById("spaOptionWrap").style.display = f.spaIncluded ? "none" : "flex";
    loadAvailability();
    updateRecap();
  });
});

function selectFormula(key){
  const input = document.querySelector(`input[name="formula"][value="${key}"]`);
  if (input){ input.checked = true; input.dispatchEvent(new Event("change")); }
  document.getElementById("reservation").scrollIntoView({ behavior: "smooth" });
}

document.getElementById("guestsMinus").addEventListener("click", () => {
  const f = CONFIG.formulas[state.formula];
  if (state.guests > f.minGuests){ state.guests--; updateRecap(); }
});
document.getElementById("guestsPlus").addEventListener("click", () => {
  const f = CONFIG.formulas[state.formula];
  if (state.guests < f.maxGuests){ state.guests++; updateRecap(); }
  else alert(`Cette formule accueille au maximum ${f.maxGuests} personnes.`);
});

document.getElementById("spaOption").addEventListener("change", (e) => {
  state.spaOption = e.target.checked;
  updateRecap();
});

/* ===========================================================
   CALCUL DU PRIX
   =========================================================== */
function countNights(checkin, checkout){
  return Math.round((checkout - checkin) / 86400000);
}

function computeStayPrice(checkin, checkout, formulaKey){
  const f = CONFIG.formulas[formulaKey];
  let total = 0;
  const cursor = new Date(checkin);
  while (cursor < checkout){
    const day = cursor.getDay(); // 0 = dimanche ... 5 = vendredi, 6 = samedi
    const isWeekendNight = (day === 5 || day === 6); // nuit de vendredi ou samedi
    total += isWeekendNight ? f.priceWeekend : f.priceWeekday;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

function computeSpaPrice(nights){
  if (nights <= 1) return CONFIG.spaPricing[0].price; // minimum applicable
  const tier = CONFIG.spaPricing.find(t => t.nights === nights);
  if (tier) return tier.price;
  if (nights > 4){
    const base = CONFIG.spaPricing[CONFIG.spaPricing.length - 1].price;
    const extraNights = nights - 4;
    return base + extraNights * CONFIG.spaExtraPerNight;
  }
  // nights === 1 fallback déjà couvert plus haut
  return CONFIG.spaPricing[0].price;
}

function updateRecap(){
  const f = CONFIG.formulas[state.formula];
  document.getElementById("recapFormula").textContent = f.label;
  document.getElementById("recapGuests").textContent = state.guests;
  document.getElementById("recapCheckin").textContent = state.checkin ? state.checkin.toLocaleDateString("fr-FR") : "—";
  document.getElementById("recapCheckout").textContent = state.checkout ? state.checkout.toLocaleDateString("fr-FR") : "—";

  const spaLabel = document.getElementById("spaOptionPrice");

  if (!state.checkin || !state.checkout){
    document.getElementById("recapNights").textContent = "—";
    document.getElementById("recapCleaning").textContent = "—";
    document.getElementById("recapTotal").textContent = "—";
    document.getElementById("recapDeposit").textContent = "—";
    document.getElementById("recapBalance").textContent = "—";
    spaLabel.textContent = "";
    document.getElementById("submitBtn").disabled = true;
    return;
  }

  const nights = countNights(state.checkin, state.checkout);
  document.getElementById("recapNights").textContent = nights;

  let stayTotal = computeStayPrice(state.checkin, state.checkout, state.formula);

  if (!f.spaIncluded){
    const spaPrice = computeSpaPrice(nights);
    spaLabel.textContent = `(+ ${euros(spaPrice)} pour ${nights} nuit${nights>1?"s":""})`;
    if (state.spaOption) stayTotal += spaPrice;
  } else {
    spaLabel.textContent = "";
  }

  const total = stayTotal + CONFIG.cleaningFee;
  const deposit = Math.round(total * CONFIG.depositRate);
  const balance = total - deposit;

  document.getElementById("recapCleaning").textContent = euros(CONFIG.cleaningFee);
  document.getElementById("recapTotal").textContent = euros(total);
  document.getElementById("recapDeposit").textContent = euros(deposit);
  document.getElementById("recapBalance").textContent = euros(balance);
  document.getElementById("submitBtn").disabled = false;
}

/* ===========================================================
   ENVOI DE LA RÉSERVATION → STRIPE CHECKOUT
   =========================================================== */
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("bookingError");
  errorEl.textContent = "";

  if (!state.checkin || !state.checkout){
    errorEl.textContent = "Merci de sélectionner vos dates de séjour.";
    return;
  }

  const formData = new FormData(e.target);
  const payload = {
    formula: state.formula,
    checkin: toISO(state.checkin),
    checkout: toISO(state.checkout),
    guests: state.guests,
    spaOption: state.spaOption,
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message")
  };

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "Redirection vers le paiement…";

  try{
    const res = await fetch(`${CONFIG.apiBase}/create-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
    window.location.href = data.url; // redirection vers Stripe Checkout
  }catch(err){
    errorEl.textContent = err.message || "Impossible de lancer le paiement. Merci de réessayer.";
    btn.disabled = false;
    btn.textContent = "Payer l'acompte et réserver";
  }
});

/* ===========================================================
   INITIALISATION
   =========================================================== */
document.getElementById("year").textContent = new Date().getFullYear();
window.Jolireve = { selectFormula };
loadAvailability();
updateRecap();
