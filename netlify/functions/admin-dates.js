// ===========================================================
// GET  /.netlify/functions/admin-dates   → liste tout (réservations + blocages)
// POST /.netlify/functions/admin-dates   → bloquer ou débloquer une période
//
// Protégé par un mot de passe partagé (variable d'environnement
// ADMIN_PASSWORD), transmis dans l'en-tête "x-admin-password".
// ===========================================================
const { getStore } = require("@netlify/blobs");

exports.handler = async function (event) {
  const password = event.headers["x-admin-password"];
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD){
    return { statusCode: 401, body: JSON.stringify({ error: "Mot de passe incorrect." }) };
  }

  const store = getStore("jolireve-bookings");

  if (event.httpMethod === "GET"){
    const ranges = (await store.get("booked-ranges", { type: "json" })) || [];
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ranges })
    };
  }

  if (event.httpMethod === "POST"){
    let payload;
    try{ payload = JSON.parse(event.body); }
    catch{ return { statusCode: 400, body: JSON.stringify({ error: "Requête invalide." }) }; }

    const { action, start, end } = payload;
    let ranges = (await store.get("booked-ranges", { type: "json" })) || [];

    if (action === "block"){
      if (!start || !end) return { statusCode: 400, body: JSON.stringify({ error: "Dates manquantes." }) };
      ranges.push({ start, end, status: "blocked", note: payload.note || "" });
      await store.setJSON("booked-ranges", ranges);
      return { statusCode: 200, body: JSON.stringify({ ok: true, ranges }) };
    }

    if (action === "unblock"){
      ranges = ranges.filter(r => !(r.status === "blocked" && r.start === start && r.end === end));
      await store.setJSON("booked-ranges", ranges);
      return { statusCode: 200, body: JSON.stringify({ ok: true, ranges }) };
    }

    if (action === "remove-any"){
      // Retrait manuel d'une entrée quelconque (utile en cas d'erreur ou d'annulation),
      // identifiée par sa position dans la liste (index) pour rester simple.
      const { index } = payload;
      if (typeof index !== "number" || index < 0 || index >= ranges.length){
        return { statusCode: 400, body: JSON.stringify({ error: "Élément introuvable." }) };
      }
      ranges.splice(index, 1);
      await store.setJSON("booked-ranges", ranges);
      return { statusCode: 200, body: JSON.stringify({ ok: true, ranges }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Action inconnue." }) };
  }

  return { statusCode: 405, body: "Méthode non autorisée" };
};
