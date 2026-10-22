export async function onRequestPost(context) {
  const { request, env } = context;
  const formData = await request.formData();

  // 1. Honeypot
  const honeypot = formData.get('website');
  if (honeypot) {
    return new Response(JSON.stringify({ error: 'Richiesta non valida.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Turnstile
  const token = formData.get('cf-turnstile-response');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Verifica di sicurezza mancante.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token
    })
  });
  const turnstileData = await turnstileRes.json();
  if (!turnstileData.success) {
    return new Response(JSON.stringify({ error: 'Verifica di sicurezza fallita.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Rate limit per IP (Cloudflare KV)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const kvKey = `rate:${ip}`;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minuti
  const maxRequests = 5;

  let record = await env.RATE_LIMIT.get(kvKey, { type: 'json' });
  if (!record || now - record.first > windowMs) {
    record = { first: now, count: 1 };
  } else {
    record.count++;
  }
  await env.RATE_LIMIT.put(kvKey, JSON.stringify(record), { expirationTtl: 600 });

  if (record.count > maxRequests) {
    return new Response(JSON.stringify({ error: 'Troppe richieste. Riprova più tardi.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. Dati
  const name = formData.get('name')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  const message = formData.get('message')?.toString().trim();

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Compila tutti i campi.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 5. Invio email (Resend)
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Modulo Contatti <noreply@tuodominio.it>',
      to: 'info@tuodominio.it',
      subject: `Nuovo messaggio da ${name}`,
      text: `Nome: ${name}\nEmail: ${email}\n\n${message}`
    })
  });

  if (!resendRes.ok) {
    return new Response(JSON.stringify({ error: 'Errore nell’invio. Riprova.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
