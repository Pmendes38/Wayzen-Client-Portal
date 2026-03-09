import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JWT_SECRET = process.env.JWT_SECRET!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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

  const { email, name, password, role, clientId } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios: email, name, password' });
  }

  try {
    // Verificar se email já existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Criar novo usuário
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash: hashPassword(password),
        role: role || 'client',
        client_id: clientId || null,
      })
      .select()
      .single();

    if (error) throw error;

    const token = jwt.sign(
      {
        id: newUser.id,
        email,
        name,
        role: role || 'client',
        clientId: clientId || null,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/; ${
        process.env.NODE_ENV === 'production' ? 'Secure;' : ''
      }`
    );

    return res.status(200).json({
      user: {
        id: newUser.id,
        email,
        name,
        role: role || 'client',
        clientId,
      },
      token,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: err.message });
  }
}
