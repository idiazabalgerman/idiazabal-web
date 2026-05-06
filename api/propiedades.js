bash

cat /home/claude/idiazabal_sitio/api/propiedades.js
Salida

export const config = { runtime: 'edge' };

const TOKKO_KEY = '341c7c1a0d66658131abc87d675afd4a438a7114';
const TOKKO_BASE = 'https://tokkobroker.com/api/v1';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo') || '';
  const zona = searchParams.get('zona') || '';
  const operacion = searchParams.get('operacion') || 'venta';
  const limite = searchParams.get('limite') || '20';

  // Mapeo de operacion
  const opMap = { venta: 1, alquiler: 2, 'alquiler-temporario': 3 };
  const opId = opMap[operacion] || 1;

  let url = `${TOKKO_BASE}/property/?key=${TOKKO_KEY}&format=json&limit=${limite}&operations=${opId}&lang=es`;

  if (tipo) url += `&type=${tipo}`;

  const res = await fetch(url);
  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'Error al consultar Tokko' }), { status: 500 });
  }

  const data = await res.json();

  // Filtrar y simplificar los datos para el frontend
  const propiedades = (data.objects || []).map(p => ({
    id: p.id,
    titulo: p.publication_title || p.address,
    direccion: p.address,
    barrio: p.location?.name || '',
    ciudad: p.location?.parent?.name || 'La Plata',
    tipo: p.type?.name || '',
    operacion: operacion,
    precio: p.operations?.[0]?.prices?.[0]?.price || 0,
    moneda: p.operations?.[0]?.prices?.[0]?.currency || 'USD',
    sup_cubierta: p.surface_covered || 0,
    sup_total: p.surface_total || 0,
    ambientes: p.room_amount || 0,
    dormitorios: p.bedroom_amount || 0,
    banos: p.bathroom_amount || 0,
    cocheras: p.parking_lot_amount || 0,
    antiguedad: p.age || '',
    foto: p.photos?.[0]?.image || '',
    fotos: p.photos?.slice(0, 5).map(f => f.image) || [],
    descripcion: p.description || '',
    url: p.web_url || '',
    precio_m2: p.surface_covered > 0 
      ? Math.round((p.operations?.[0]?.prices?.[0]?.price || 0) / p.surface_covered) 
      : 0,
  }));

  return new Response(JSON.stringify({
    total: data.meta?.total_count || 0,
    propiedades
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
