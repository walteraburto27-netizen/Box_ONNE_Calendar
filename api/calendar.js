// api/calendar.js
// Vercel serverless function — Google Calendar proxy
// Env vars needed: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, CALENDAR_ID
// PIN auth: ADMIN_PIN (Zelena), STAFF_PIN (profesores)

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GCAL_BASE = 'https://www.googleapis.com/calendar/v3';

// ── helpers ──────────────────────────────────────────────────────────────────

async function getAccessToken() {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(data));
  return data.access_token;
}

function authCheck(req) {
  const pin = req.headers['x-pin'] || '';
  if (pin === process.env.ADMIN_PIN)  return 'admin';
  if (pin === process.env.STAFF_PIN)  return 'staff';
  return null;
}

function json(res, status, data) {
  res.status(status).json(data);
}

// ── main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  const role = authCheck(req);
  if (!role) return json(res, 401, { error: 'PIN inválido' });

  const calendarId = encodeURIComponent(process.env.CALENDAR_ID);
  let token;
  try {
    token = await getAccessToken();
  } catch (e) {
    return json(res, 500, { error: e.message });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // ── GET /api/calendar?start=...&end=... ──────────────────────────────────
  if (req.method === 'GET') {
    const { start, end } = req.query;
    if (!start || !end) return json(res, 400, { error: 'start y end requeridos' });

    const url = `${GCAL_BASE}/calendars/${calendarId}/events?timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}&singleEvents=true&orderBy=startTime&maxResults=250`;
    const r = await fetch(url, { headers });
    const data = await r.json();

    if (!r.ok) return json(res, r.status, data);

    const events = (data.items || []).map(e => ({
      id:       e.id,
      title:    e.summary || '',
      start:    e.start?.dateTime || e.start?.date,
      end:      e.end?.dateTime   || e.end?.date,
      desc:     e.description || '',
      color:    e.colorId || '',
      type:     detectType(e.summary || ''),
    }));

    return json(res, 200, { events });
  }

  // ── POST /api/calendar — create event ────────────────────────────────────
  if (req.method === 'POST') {
    const { title, start, end, description, colorId } = req.body;
    if (!title || !start || !end) return json(res, 400, { error: 'title, start, end requeridos' });

    const body = {
      summary:     title,
      description: description || '',
      start:       { dateTime: start, timeZone: 'America/Santiago' },
      end:         { dateTime: end,   timeZone: 'America/Santiago' },
      colorId:     colorId || undefined,
    };

    const r = await fetch(`${GCAL_BASE}/calendars/${calendarId}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) return json(res, r.status, data);
    return json(res, 201, { id: data.id, title: data.summary });
  }

  // ── DELETE /api/calendar?id=... ──────────────────────────────────────────
  if (req.method === 'DELETE') {
    if (role !== 'admin') return json(res, 403, { error: 'Solo admin puede eliminar' });
    const { id } = req.query;
    if (!id) return json(res, 400, { error: 'id requerido' });

    const r = await fetch(`${GCAL_BASE}/calendars/${calendarId}/events/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (r.status === 204) return json(res, 200, { ok: true });
    const data = await r.json();
    return json(res, r.status, data);
  }

  return json(res, 405, { error: 'Método no soportado' });
}

// ── type detection from title ─────────────────────────────────────────────
function detectType(title) {
  const t = title.toLowerCase();
  if (t.includes('evaluación') || t.includes('evaluacion')) return 'eval';
  if (t.includes('bloqueado') || t.includes('mantención') || t.includes('reservado')) return 'blocked';
  if (t.includes('nutrición') || t.includes('nutricion') || t.includes('zelena')) return 'nutricion';
  return 'clase';
}
