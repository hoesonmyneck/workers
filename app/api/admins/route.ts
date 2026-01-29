import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { logAdminAction } from '@/lib/logger';

// Получить список всех администраторов
export async function GET() {
  try {
    const owner = await requireOwner();

    const admins = await query(`
      SELECT id, username, full_name, role, created_at, updated_at
      FROM admins
      ORDER BY 
        CASE role 
          WHEN 'owner' THEN 1 
          WHEN 'admin' THEN 2 
          ELSE 3 
        END,
        created_at
    `);

    return NextResponse.json({ admins });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    if (error.message?.includes('Owner access required')) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуются права владельца' },
        { status: 403 }
      );
    }
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка администраторов' },
      { status: 500 }
    );
  }
}

// Создать нового администратора
export async function POST(request: NextRequest) {
  try {
    const owner = await requireOwner();
    const { username, password, full_name, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    // Проверка роли
    const validRoles = ['admin', 'owner'];
    const adminRole = role && validRoles.includes(role) ? role : 'admin';

    // Проверка на существование
    const existing = await queryOne(
      'SELECT id FROM admins WHERE username = $1',
      [username]
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Администратор с таким логином уже существует' },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(password);

    // Создаем администратора
    const result = await query(
      `INSERT INTO admins (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, full_name, role, created_at`,
      [username, passwordHash, full_name || '', adminRole]
    );

    const newAdmin = result[0];

    // Логируем действие
    await logAdminAction({
      admin_username: owner.username,
      action_type: 'create',
      table_name: 'admins',
      description: `Создан новый администратор: ${username} (роль: ${adminRole})`,
      new_values: { username, full_name, role: adminRole },
    });

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    if (error.message?.includes('Owner access required')) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуются права владельца' },
        { status: 403 }
      );
    }
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при создании администратора' },
      { status: 500 }
    );
  }
}
