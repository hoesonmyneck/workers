import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { logAdminAction } from '@/lib/logger';

// Обновить администратора
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const owner = await requireOwner();
    const body = await request.json();

    // Получаем старые данные для логирования
    const oldAdmin = await queryOne<any>(
      'SELECT * FROM admins WHERE id = $1',
      [params.id]
    );

    if (!oldAdmin) {
      return NextResponse.json(
        { error: 'Администратор не найден' },
        { status: 404 }
      );
    }

    // Нельзя редактировать самого себя
    if (oldAdmin.id === owner.id) {
      return NextResponse.json(
        { error: 'Нельзя редактировать свой собственный аккаунт' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Username
    if (body.username !== undefined && body.username !== oldAdmin.username) {
      // Проверка на существование
      const existing = await queryOne(
        'SELECT id FROM admins WHERE username = $1 AND id != $2',
        [body.username, params.id]
      );

      if (existing) {
        return NextResponse.json(
          { error: 'Администратор с таким логином уже существует' },
          { status: 400 }
        );
      }

      updates.push(`username = $${paramIndex}`);
      values.push(body.username);
      paramIndex++;
    }

    // Full name
    if (body.full_name !== undefined) {
      updates.push(`full_name = $${paramIndex}`);
      values.push(body.full_name);
      paramIndex++;
    }

    // Role
    if (body.role !== undefined) {
      const validRoles = ['admin', 'owner'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json(
          { error: 'Недопустимая роль' },
          { status: 400 }
        );
      }
      updates.push(`role = $${paramIndex}`);
      values.push(body.role);
      paramIndex++;
    }

    // Password (если предоставлен)
    if (body.password && body.password.trim() !== '') {
      const passwordHash = await hashPassword(body.password);
      updates.push(`password_hash = $${paramIndex}`);
      values.push(passwordHash);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Нет полей для обновления' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(params.id);

    const result = await query(
      `UPDATE admins
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, username, full_name, role, created_at, updated_at`,
      values
    );

    const updatedAdmin = result[0];

    // Логируем действие
    await logAdminAction({
      admin_username: owner.username,
      action_type: 'update',
      table_name: 'admins',
      record_id: parseInt(params.id),
      description: `Обновлен администратор: ${updatedAdmin.username}`,
      old_values: {
        username: oldAdmin.username,
        full_name: oldAdmin.full_name,
        role: oldAdmin.role,
      },
      new_values: {
        username: updatedAdmin.username,
        full_name: updatedAdmin.full_name,
        role: updatedAdmin.role,
      },
    });

    return NextResponse.json(updatedAdmin);
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
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при обновлении администратора' },
      { status: 500 }
    );
  }
}

// Удалить администратора
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const owner = await requireOwner();

    // Получаем данные администратора
    const admin = await queryOne<any>(
      'SELECT * FROM admins WHERE id = $1',
      [params.id]
    );

    if (!admin) {
      return NextResponse.json(
        { error: 'Администратор не найден' },
        { status: 404 }
      );
    }

    // Нельзя удалить самого себя
    if (admin.id === owner.id) {
      return NextResponse.json(
        { error: 'Нельзя удалить свой собственный аккаунт' },
        { status: 400 }
      );
    }

    // Нельзя удалить другого owner
    if (admin.role === 'owner') {
      return NextResponse.json(
        { error: 'Нельзя удалить аккаунт владельца' },
        { status: 400 }
      );
    }

    // Удаляем администратора
    await query('DELETE FROM admins WHERE id = $1', [params.id]);

    // Логируем действие
    await logAdminAction({
      admin_username: owner.username,
      action_type: 'delete',
      table_name: 'admins',
      record_id: parseInt(params.id),
      description: `Удален администратор: ${admin.username}`,
      old_values: {
        username: admin.username,
        full_name: admin.full_name,
        role: admin.role,
      },
    });

    return NextResponse.json({ success: true });
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
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при удалении администратора' },
      { status: 500 }
    );
  }
}
