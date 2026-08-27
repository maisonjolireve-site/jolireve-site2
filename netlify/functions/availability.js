// ===========================================================
// GET /.netlify/functions/availability
// Synchronisation complète : Airbnb + Abritel + GreenGo
// ===========================================================

exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "Cache-Control": "no-store, max-age=0"
  };

  const booked = [];

  // Récupération des URLs de synchronisation configurées sur Netlify
  const icalUrls = [
    process.env.AIRBNB_ICAL_URL,
    process.env.GREENGO_ICAL_URL,
    process.env.ABRITEL_ICAL_URL
  ].filter(Boolean);

  // 1. Lecture de tous les flux iCal externes
  for (const url of icalUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();

      // Découpage des événements du calendrier
      const events = text.split("BEGIN:VEVENT");
      for (let i = 1; i < events.length; i++) {
        const block = events[i];
        
        // Extraction des dates de début et de fin
        const startMatch = block.match(/DTSTART(?:;[^:]+)?:(\d{4})(\d{2})(\d{2})/);
        const endMatch = block.match(/DTEND(?:;[^:]+)?:(\d{4})(\d{2})(\d{2})/);

        if (startMatch && endMatch) {
          const startDate = `${startMatch[1]}-${startMatch[2]}-${startMatch[3]}`;
          const endDate = `${endMatch[1]}-${endMatch[2]}-${endMatch[3]}`;
          booked.push({ start: startDate, end: endDate });
        }
      }
    } catch (err) {
      console.warn("Erreur lecture d'un flux iCal:", err.message);
    }
  }

  // 2. Récupération des réservations stockées sur Netlify (si configuré)
  try {
    const { getStore } = require("@netlify/blobs");
    const store = getStore("jolireve-bookings");
    const localList = await store.get("booked-ranges", { type: "json" });
    if (Array.isArray(localList)) {
      booked.push(...localList);
    }
  } catch (e) {
    // Si Netlify Blobs n'est pas actif, on continue sans bloquer
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ booked })
  };
};
