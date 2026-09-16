// Proxy serverless: oculta el token de Airtable en el servidor (variable de entorno
// AIRTABLE_TOKEN en Vercel), para que nunca viaje en el HTML/JS que descarga el navegador.
export default async function handler(req, res) {
  try {
    const token = process.env.AIRTABLE_TOKEN;
    if (!token) {
      res.status(500).json({ error: { message: 'Falta configurar la variable de entorno AIRTABLE_TOKEN en Vercel.' } });
      return;
    }
    const host = req.query.host === 'content' ? 'https://content.airtable.com' : 'https://api.airtable.com';
    const path = req.query.path;
    if (!path || !path.startsWith('/v0/')) {
      res.status(400).json({ error: { message: 'Ruta invalida.' } });
      return;
    }
    const upstream = await fetch(host + path, {
      method: req.method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: (req.method === 'GET' || req.method === 'DELETE') ? undefined : JSON.stringify(req.body)
    });
    const retryAfter = upstream.headers.get('retry-after');
    if (retryAfter) res.setHeader('Retry-After', retryAfter);
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: { message: String(err) } });
  }
}
