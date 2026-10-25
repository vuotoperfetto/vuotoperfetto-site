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

  // 3. Validazione campi obbligatori
  const required = ['nome', 'cognome', 'azienda', 'partita_iva', 'localita', 'email', 'telefono', 'messaggio'];
  for (const field of required) {
    if (!formData.get(field)?.toString().trim()) {
      return new Response(JSON.stringify({ error: `Il campo ${field} è obbligatorio.` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  const privacy = formData.get('privacy');
  if (!privacy) {
    return new Response(JSON.stringify({ error: 'Devi accettare l\'informativa sulla privacy.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. Estrazione dati
  const nome = formData.get('nome').toString().trim();
  const cognome = formData.get('cognome').toString().trim();
  const azienda = formData.get('azienda').toString().trim();
  const partitaIva = formData.get('partita_iva').toString().trim();
  const localita = formData.get('localita').toString().trim();
  const email = formData.get('email').toString().trim();
  const telefono = formData.get('telefono').toString().trim();
  const messaggio = formData.get('messaggio').toString().trim();

  // 5. Composizione email
  const emailText = `Nuovo messaggio dal modulo contatti VuotoPerfetto

Nome: ${nome}
Cognome: ${cognome}
Azienda: ${azienda}
Partita IVA: ${partitaIva}
Località: ${localita}
Email: ${email}
Telefono: ${telefono}

Messaggio:
${messaggio}
`;

  // 6. Invio tramite Resend
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Modulo Contatti <onboarding@resend.dev>',
        to: ['vuotoperfetto@gmail.com'],
        reply_to: email,
        subject: `Nuovo contatto da ${nome} ${cognome} (${azienda})`,
        text: emailText
      })
    });

    if (!resendRes.ok) {
      const errorBody = await resendRes.text();
      console.error('ERRORE RESEND:', errorBody);
      return new Response(JSON.stringify({ error: 'Errore nell\'invio. Riprova più tardi.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    console.error('ERRORE INVIO EMAIL:', err);
    return new Response(JSON.stringify({ error: 'Errore nell\'invio. Riprova più tardi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 7. Risposta di successo
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
