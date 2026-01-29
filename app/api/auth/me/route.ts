import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getSession();

    if (!admin) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении сессии' },
      { status: 500 }
    );
  }
}
