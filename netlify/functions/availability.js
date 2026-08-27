// ===========================================================
// GET /.netlify/functions/availability
// Renvoie la liste des périodes indisponibles (réservées ou
// bloquées manuellement par l'hôte), tous formats confondus,
// car les deux formules partagent le même bien physique.
// ===========================================================
const { getStore } = require("@netlify/blobs");

exports.handler = async function () {
  try {
    const store = getStore("jolireve-bookings");
    const list = await store.get("booked-ranges", { type: "json" });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ booked: list || [] })
    };
  } catch (err) {
    console.error("Erreur availability:", err);
    return {
      statusCode: 200, // on ne bloque jamais l'affichage du calendrier côté visiteur
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booked: [] })
    };
  }
};
