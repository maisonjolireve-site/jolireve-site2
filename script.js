/* ===========================================================
   JOLIRÊVE — script principal
   Toute la configuration modifiable (prix, capacités, textes)
   est regroupée dans l'objet CONFIG ci-dessous.
   =========================================================== */

const CONFIG = {
  // Chemin des fonctions serveur (Netlify Functions)
  apiBase: "/.netlify/functions",

  depositRate: 0.30, // 30 % d'acompte
  cleaningFee: 120, // ménage fin de séjour

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

  // Tarif du spa en option (formule Intime uniquement)
  spaPricing: [
    { nights: 2, price: 160 },
    { nights: 3, price: 210 },
    { nights: 4, price: 240 }
  ],
  spaExtraPerNight: 50,

  // Formatage monétaire
  currency: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
};

function euros(n){ return CONFIG.currency.format(n); }

/* ===========================================================
   GALERIE PHOTOS
   =========================================================== */
const GALERIE_PHOTOS = [
  // Extérieur & Détente
  { src: "images/spa-hero.jpeg", category: "exterieur", alt: "Cour en pierre et spa illuminé au crépuscule" },
  { src: "images/exterieur-table-soir-1.jpeg", category: "exterieur", alt: "Table dressée dehors sous les guirlandes lumineuses" },
{ src: "images/exterieur-transats.jpeg", category: "exterieur", alt: "Espace transats et détente au soleil" },
  { src: "images/exterieur-brasero.jpeg", category: "exterieur", alt: "Espace brasero convivial dans la cour close" },
  { src: "images/exterieur-babyfoot.jpeg", category: "exterieur", alt: "Baby-foot extérieur sous le préau" },

  // Spa de nage
  { src: "images/spa-10.jpeg", category: "spa", alt: "Grand spa de nage chauffé avec vue d'ensemble" },
  { src: "images/spa-14-bleu.jpeg", category: "spa", alt: "Ambiance nocturne éclairage LED bleu du spa" },

  // Séjour / Salon
  { src: "images/salon-mezzanine-1.jpeg", category: "salon", alt: "Grand séjour lumineux avec poutres apparentes" },

  // Cuisine & Repas
  { src: "images/cuisine-table.jpeg", category: "cuisine", alt: "Grande table en chêne conviviale" },

  // Chambres & Salles d'eau
  { src: "images/chambre-1.jpeg", category: "chambres", alt: "Chambre parentale lumineuse et soignée" },
  { src: "images/chambre-2-tropical.jpeg", category: "chambres", alt: "Chambre double décoration chaleureuse" },
  { src: "images/chambre-dortoir-lits-superposes.jpeg", category: "chambres", alt: "Dortoir familial avec lits superposés" },
  { src: "images/salle-eau-douche-italienne.jpeg", category: "salle-eau", alt: "Salle d'eau moderne avec douche à l'italienne" },
  { src: "images/salle-eau-vasque.jpeg", category: "salle-eau", alt: "Meuble vasque et finitions soignées" }
];

let lightboxItems = [];
let lightboxIndex = 0;

function renderGallery(filter = "all"){
  const grid = document.getElementById("galerieGrid");
  if (!grid) return;
  grid.innerHTML = "";
  
  const items = GALERIE_PHOTOS.filter(g => filter === "all" || g.category === filter);
  
  items.forEach((g, i) => {
    const div = document.createElement("div");
    div.className = "g-item";
    const img = document.createElement("img");
    img.src = g.src;
    img.alt = g.alt;
    img.loading = "lazy";
    img.addEventListener("click", () => openLightbox(items, i));
    div.appendChild(img);
    grid.appendChild(div);
  });
}

function openLightbox(items, index){
  lightboxItems = items;
  lightboxIndex = index;
  updateLightbox();
  const lb = document.getElementById("lightbox");
  if (lb) lb.classList.add("active");
}

function updateLightbox(){
  const item = lightboxItems[lightboxIndex];
  const img = document.getElementById("lightboxImg");
  if (img && item) {
    img.src = item.src;
    img.alt = item.alt;
  }
}

const lbClose = document.getElementById("lightboxClose");
if (lbClose) {
  lbClose.addEventListener("click", () => {
    document.getElementById("lightbox").classList.remove("active");
  });
}

const lb = document.getElementById("lightbox");
if (lb) {
  lb.addEventListener("click", (e) => {
    if (e.target.id === "lightbox") lb.classList.remove("active");
  });
}

const lbPrev = document.getElementById("lightboxPrev");
if (lbPrev) {
  lbPrev.addEventListener("click", () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    updateLightbox();
  });
}

const lbNext = document.getElementById("lightboxNext");
if (lbNext) {
  lbNext.addEventListener("click", () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
    updateLightbox();
  });
}

document.addEventListener("keydown", (e) => {
  const lbEl = document.getElementById("lightbox");
  if (!lbEl || !lbEl.classList.contains("active")) return;
  if (e.key === "Escape") lbEl.classList.remove("active");
  if (e.key === "ArrowLeft" && lbPrev) lbPrev.click();
  if (e.key === "ArrowRight" && lbNext) lbNext.click();
});

document.querySelectorAll(".filtre").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filtre").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderGallery(btn.dataset.filter);
  });
});

/* ===========================================================
   NAVIGATION — effet au scroll
   =========================================================== */
const nav = document.getElementById("nav");
if (nav) {
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  });
}

/* ===========================================================
   CALENDRIER DE RÉSERVATION
   =========================================================== */
const state = {
  formula: "intime",
  guests: 2,
  checkin: null,
  checkout: null,
  spaOption: false,
  bookedRanges: [],
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
    if (!res.ok) throw new Error("Réponse serveur");
    const data = await res.json();
    state.bookedRanges = data.booked || [];
  }catch(err){
    state.bookedRanges = [];
  }
  renderCalendar();
}

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function renderCalendar(){
  const grid = document.getElementById("calGrid");
  const label = document.getElementById("calMonthLabel");
  if (!grid || !label) return;

  grid.innerHTML = "";
  label.textContent = `${MONTHS_FR[state.viewMonth]} ${state.viewYear}`;

  const first = new Date(state.viewYear, state.viewMonth, 1);
  const startOffset = (first.getDay() + 6) % 7;
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

    if (isPast) cell.classList.add("cal-day--booked");
    else if (isBooked) cell.classList.add("cal-day--booked");
    else {
      cell.classList.add("cal-day--free");
      cell.addEventListener("click", () => onDayClick(date));
    }

    if (isSelectedStart || isSelectedEnd) cell.classList.add("cal-day--selected");
    else if (isInRange) cell.classList.add("cal-day--in-range");

    grid.appendChild(cell);
  }
}

function onDayClick(date){
  if (!state.checkin || (state.checkin && state.checkout)){
    state.checkin = date;
    state.checkout = null;
  } else {
    if (date <= state.checkin){
      state.checkin = date;
      state.checkout = null;
    } else {
      let conflict = false;
      const cursor = new Date(state.checkin);
      while (cursor < date){
        if (isDateBooked(cursor)){ conflict = true; break; }
        cursor.setDate(cursor.getDate() + 1);
      }
      if (conflict){
        alert("Certaines dates de cette période sont déjà réservées. Merci de choisir un autre créneau.");
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

const calPrev = document.getElementById("calPrev");
if (calPrev) {
  calPrev.addEventListener("click", () => {
    state.viewMonth--;
    if (state.viewMonth < 0){ state.viewMonth = 11; state.viewYear--; }
    renderCalendar();
  });
}

const calNext = document.getElementById("calNext");
if (calNext) {
  calNext.addEventListener("click", () => {
    state.viewMonth++;
    if (state.viewMonth > 11){ state.viewMonth = 0; state.viewYear++; }
    renderCalendar();
  });
}

/* ===========================================================
   FORMULE / VOYAGEURS / OPTION SPA
   =========================================================== */
document.querySelectorAll('input[name="formula"]').forEach(radio => {
  radio.addEventListener("change", (e) => {
    state.formula = e.target.value;
    const f = CONFIG.formulas[state.formula];
    if (state.guests > f.maxGuests) state.guests = f.maxGuests;
    const wrap = document.getElementById("spaOptionWrap");
    if (wrap) wrap.style.display = f.spaIncluded ? "none" : "flex";
    loadAvailability();
    updateRecap();
  });
});

function selectFormula(key){
  const input = document.querySelector(`input[name="formula"][value="${key}"]`);
  if (input){ input.checked = true; input.dispatchEvent(new Event("change")); }
  const resSection = document.getElementById("reservation");
  if (resSection) resSection.scrollIntoView({ behavior: "smooth" });
}

const gMinus = document.getElementById("guestsMinus");
if (gMinus) {
  gMinus.addEventListener("click", () => {
    const f = CONFIG.formulas[state.formula];
    if (state.guests > f.minGuests){ state.guests--; updateRecap(); }
  });
}

const gPlus = document.getElementById("guestsPlus");
if (gPlus) {
  gPlus.addEventListener("click", () => {
    const f = CONFIG.formulas[state.formula];
    if (state.guests < f.maxGuests){ state.guests++; updateRecap(); }
    else alert(`Cette formule accueille au maximum ${f.maxGuests} personnes.`);
  });
}

const spaOpt = document.getElementById("spaOption");
if (spaOpt) {
  spaOpt.addEventListener("change", (e) => {
    state.spaOption = e.target.checked;
    updateRecap();
  });
}

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
    const extraNights = nights - 4;
    return base + extraNights * CONFIG.spaExtraPerNight;
  }
  return CONFIG.spaPricing[0].price;
}

function updateRecap(){
  const f = CONFIG.formulas[state.formula];
  const rForm = document.getElementById("recapFormula");
  const rGuests = document.getElementById("recapGuests");
  const rIn = document.getElementById("recapCheckin");
  const rOut = document.getElementById("recapCheckout");
  const rNights = document.getElementById("recapNights");
  const rClean = document.getElementById("recapCleaning");
  const rTot = document.getElementById("recapTotal");
  const rDep = document.getElementById("recapDeposit");
  const rBal = document.getElementById("recapBalance");
  const spaLabel = document.getElementById("spaOptionPrice");
  const submitBtn = document.getElementById("submitBtn");

  if (rForm) rForm.textContent = f.label;
  if (rGuests) rGuests.textContent = state.guests;
  if (rIn) rIn.textContent = state.checkin ? state.checkin.toLocaleDateString("fr-FR") : "—";
  if (rOut) rOut.textContent = state.checkout ? state.checkout.toLocaleDateString("fr-FR") : "—";

  if (!state.checkin || !state.checkout){
    if (rNights) rNights.textContent = "—";
    if (rClean) rClean.textContent = "—";
    if (rTot) rTot.textContent = "—";
    if (rDep) rDep.textContent = "—";
    if (rBal) rBal.textContent = "—";
    if (spaLabel) spaLabel.textContent = "";
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  const nights = countNights(state.checkin, state.checkout);
  if (rNights) rNights.textContent = `${nights} nuit${nights > 1 ? "s" : ""}`;

  let stayTotal = computeStayPrice(state.checkin, state.checkout, state.formula);

  if (!f.spaIncluded){
    const spaPrice = computeSpaPrice(nights);
    if (spaLabel) spaLabel.textContent = `(+ ${euros(spaPrice)} pour ${nights} nuit${nights > 1 ? "s" : ""})`;
    if (state.spaOption) stayTotal += spaPrice;
  } else {
    if (spaLabel) spaLabel.textContent = "";
  }

  const total = stayTotal + CONFIG.cleaningFee;
  const deposit = Math.round(total * CONFIG.depositRate);
  const balance = total - deposit;

  if (rClean) rClean.textContent = euros(CONFIG.cleaningFee);
  if (rTot) rTot.textContent = euros(total);
  if (rDep) rDep.textContent = euros(deposit);
  if (rBal) rBal.textContent = euros(balance);
  if (submitBtn) submitBtn.disabled = false;
}

/* ===========================================================
   ENVOI DE LA RÉSERVATION → STRIPE CHECKOUT
   =========================================================== */
const bForm = document.getElementById("bookingForm");
if (bForm) {
  bForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("bookingError");
    if (errorEl) errorEl.textContent = "";

    if (!state.checkin || !state.checkout){
      if (errorEl) errorEl.textContent = "Merci de sélectionner vos dates de séjour.";
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
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Redirection vers le paiement…";
    }

    try{
      const res = await fetch(`${CONFIG.apiBase}/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
      window.location.href = data.url;
    }catch(err){
      if (errorEl) errorEl.textContent = err.message || "Impossible de lancer le paiement. Merci de réessayer.";
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Payer l'acompte et réserver";
      }
    }
  });
}

/* ===========================================================
   INITIALISATION
   =========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  window.Jolireve = { selectFormula };
  renderGallery("all");
  loadAvailability();
  updateRecap();
});
