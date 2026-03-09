import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clear token cookie
  res.setHeader(
    'Set-Cookie',
    `token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/; ${
      process.env.NODE_ENV === 'production' ? 'Secure;' : ''
    }`
  );

  return res.status(200).json({ success: true });
}
