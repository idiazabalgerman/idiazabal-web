export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { email, nombre } = await req.json();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email requerido' }), { status: 400 });
  }

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Idiazabal Bienes Raices <onboarding@resend.dev>',
      to: email,
      subject: 'Tu codigo de verificacion - Idiazabal',
      html: `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:40px 20px;"><h1 style="font-size:24px;color:#1E1E1C;letter-spacing:2px;">IDIAZABAL</h1><p style="color:#C9912E;font-size:11px;letter-spacing:3px;">INVERSIONES & BIENES RAICES</p><hr style="border-color:#C9912E;border-width:3px;"><p style="color:#1E1E1C;font-size:16px;">Hola ${nombre || ''},</p><p style="color:#6B6866;font-size:14px;">Tu informe de tasacion esta listo. Ingresa el siguiente codigo:</p><div style="background:#FAF8F3;border-left:4px solid #C9912E;padding:24px;text-align:center;margin:28px 0;"><p style="font-size:42px;font-weight:bold;color:#1E1E1C;letter-spacing:8px;margin:0;">${codigo}</p><p style="font-size:12px;color:#AEABA2;margin:8px 0 0;">Valido por 10 minutos</p></div><p style="color:#AEABA2;font-size:11px;">Idiazabal Inversiones & Bienes Raices - La Plata, Buenos Aires</p></div>`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'Error al enviar mail', detail: err }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, codigo }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
