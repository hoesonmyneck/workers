import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { logAdminAction } from '@/lib/logger';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const admin = await getSession();

    if (admin) {
      // Логируем выход
      await logAdminAction({
        admin_username: admin.username,
        action_type: 'logout',
        description: 'Выход из системы',
      });
    }

    // Удаляем cookie
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Ошибка при выходе' },
      { status: 500 }
    );
  }
}
