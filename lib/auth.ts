import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { queryOne } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export interface Admin {
  id: number;
  username: string;
  full_name: string | null;
  role: string;
}

export interface JWTPayload {
  sub: string; // admin id
  username: string;
  full_name?: string;
  role: string;
  iat: number;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(admin: Admin): Promise<string> {
  const token = await new SignJWT({
    username: admin.username,
    full_name: admin.full_name || '',
    role: admin.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(admin.id.toString())
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<Admin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  const admin = await queryOne<Admin>(
    'SELECT id, username, full_name, role FROM admins WHERE id = $1',
    [parseInt(payload.sub)]
  );

  return admin;
}

export async function requireAuth(): Promise<Admin> {
  const admin = await getSession();
  if (!admin) {
    throw new Error('Unauthorized');
  }
  return admin;
}

export async function requireOwner(): Promise<Admin> {
  const admin = await getSession();
  if (!admin) {
    throw new Error('Unauthorized');
  }
  if (admin.role !== 'owner') {
    throw new Error('Forbidden: Owner access required');
  }
  return admin;
}
