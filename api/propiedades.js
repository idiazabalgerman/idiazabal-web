bash

cat /home/claude/idiazabal_sitio/api/propiedades.js
Salida

export const config = { runtime: 'edge' };

const TOKKO_KEY = '341c7c1a0d66658131abc87d675afd4a438a7114';
const TOKKO_BASE = 'https://tokkobroker.com/api/v1';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const operacion = searchParams.get('operacion') || 'venta';
  const limite = searchParams.get('limite') || '6';
  const opMap = { venta: 1, alquiler: 2 };
  const opId = opMap[operacion] || 1;

  const url = `${TOKKO_BASE}/property/?key=${TOKKO_KEY}&format=json&limit=${limite}&operations=${opId}&lang=es`;

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
      return new Response(JSON.stringify({ error: errText, propiedades: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await res.json();
    const propiedades = (data.objects || []).map(p => ({
      id: p.id,
      titulo: p.publication_title || p.address,
      direccion: p.address,
      barrio: p.location?.name || '',
      tipo: p.type?.name || '',
      operacion,
      precio: p.operations?.[0]?.prices?.[0]?.price || 0,
      moneda: p.operations?.[0]?.prices?.[0]?.currency || 'USD',
      sup_cubierta: p.surface_covered || 0,
      ambientes: p.room_amount || 0,
      dormitorios: p.bedroom_amount || 0,
      banos: p.bathroom_amount || 0,
      cocheras: p.parking_lot_amount || 0,
      foto: p.photos?.[0]?.image || '',
      url: p.web_url || '',
      precio_m2: p.surface_covered > 0
        ? Math.round((p.operations?.[0]?.prices?.[0]?.price || 0) / p.surface_covered) : 0,
    }));

    return new Response(JSON.stringify({ total: data.meta?.total_count || 0, propiedades }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message, propiedades: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
