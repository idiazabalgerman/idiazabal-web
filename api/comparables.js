bash

cat /home/claude/idiazabal_sitio/api/comparables.js
Salida

export const config = { runtime: 'edge' };

const TOKKO_KEY = '341c7c1a0d66658131abc87d675afd4a438a7114';
const TOKKO_BASE = 'https://tokkobroker.com/api/v1';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo') || '';
  const sup = parseFloat(searchParams.get('sup') || '0');
  const amb = parseInt(searchParams.get('amb') || '0');

  let url = `${TOKKO_BASE}/property/?key=${TOKKO_KEY}&format=json&limit=50&operations=1&lang=es`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IdiazabalBot/1.0)',
        'Accept': 'application/json',
        'Referer': 'https://idiazabalbienesraices.com.ar',
        'Origin': 'https://idiazabalbienesraices.com.ar',
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ 
        error: 'Error Tokko', 
        status: res.status,
        detail: errText 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await res.json();
    const todas = data.objects || [];

    let comparables = todas.filter(p => {
      const precio = p.operations?.[0]?.prices?.[0]?.price || 0;
      const supCub = p.surface_covered || 0;
      if (!precio || !supCub) return false;
      if (tipo && p.type?.name && !p.type.name.toLowerCase().includes(tipo.toLowerCase())) return false;
      if (sup > 0) {
        const diff = Math.abs(supCub - sup) / sup;
        if (diff > 0.4) return false;
      }
      return true;
    });

    const comparablesConM2 = comparables.map(p => {
      const precio = p.operations?.[0]?.prices?.[0]?.price || 0;
      const supCub = p.surface_covered || 1;
      const precioM2 = Math.round(precio / supCub);
      let score = 100;
      if (sup > 0) score -= Math.abs(supCub - sup) / sup * 60;
      if (amb > 0 && p.room_amount) score -= Math.abs(p.room_amount - amb) * 10;

      return {
        id: p.id,
        titulo: p.publication_title || p.address,
        direccion: p.address,
        barrio: p.location?.name || '',
        tipo: p.type?.name || '',
        precio,
        moneda: p.operations?.[0]?.prices?.[0]?.currency || 'USD',
        sup_cubierta: supCub,
        ambientes: p.room_amount || 0,
        dormitorios: p.bedroom_amount || 0,
        banos: p.bathroom_amount || 0,
        precio_m2: precioM2,
        similitud: Math.max(0, Math.min(100, Math.round(score))),
        fuente: 'Idiazabal',
        foto: p.photos?.[0]?.image || '',
      };
    });

    comparablesConM2.sort((a, b) => b.similitud - a.similitud);
    const top = comparablesConM2.slice(0, 8);
    const precios_m2 = top.map(c => c.precio_m2).filter(p => p > 0);
    const promedio_m2 = precios_m2.length > 0
      ? Math.round(precios_m2.reduce((a, b) => a + b, 0) / precios_m2.length) : 0;
    const precio_estimado = sup > 0 && promedio_m2 > 0 ? Math.round(sup * promedio_m2) : 0;
    const precio_min = precios_m2.length > 0 ? Math.round(sup * Math.min(...precios_m2) * 0.95) : 0;
    const precio_max = precios_m2.length > 0 ? Math.round(sup * Math.max(...precios_m2) * 1.05) : 0;

    return new Response(JSON.stringify({
      comparables: top,
      estadisticas: { promedio_m2, precio_estimado, precio_min, precio_max, total_comparables: top.length,
        confianza: Math.min(85, Math.round((top.length / 8) * 85)) }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
