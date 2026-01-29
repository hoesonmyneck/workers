import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAdminAction } from '@/lib/logger';

// Получить список всех столбцов с метаданными
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeAdminOnly = searchParams.get('admin') === 'true';

    // Получаем информацию о столбцах с метаданными
    let whereClause = `c.table_name = 'employees' AND c.column_name NOT IN ('id', 'created_at', 'updated_at')`;
    
    // Если не админ, исключаем столбцы только для админов
    if (!includeAdminOnly) {
      whereClause += ` AND COALESCE(m.admin_only, false) = false`;
    }

    const columns = await query(`
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        COALESCE(m.display_name, c.column_name) as display_name,
        COALESCE(m.is_visible, true) as is_visible,
        COALESCE(m.sort_order, 999) as sort_order,
        COALESCE(m.admin_only, false) as admin_only
      FROM information_schema.columns c
      LEFT JOIN columns_metadata m ON c.column_name = m.column_name
      WHERE ${whereClause}
      ORDER BY COALESCE(m.sort_order, 999), c.ordinal_position
    `);

    return NextResponse.json({ columns });
  } catch (error) {
    console.error('Error fetching columns:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении столбцов' },
      { status: 500 }
    );
  }
}

// Добавить новый столбец
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth();
    const { column_name, display_name, data_type, is_nullable, admin_only } = await request.json();

    if (!column_name || !data_type || !display_name) {
      return NextResponse.json(
        { error: 'Название столбца, русское название и тип данных обязательны' },
        { status: 400 }
      );
    }

    // Проверка на допустимые символы в имени столбца
    if (!/^[a-z_][a-z0-9_]*$/.test(column_name)) {
      return NextResponse.json(
        { error: 'Название столбца должно содержать только строчные буквы латиницы, цифры и подчеркивания' },
        { status: 400 }
      );
    }

    // Проверка на зарезервированные имена
    const reservedNames = ['id', 'created_at', 'updated_at'];
    if (reservedNames.includes(column_name)) {
      return NextResponse.json(
        { error: 'Это имя столбца зарезервировано' },
        { status: 400 }
      );
    }

    const nullableClause = is_nullable ? 'NULL' : 'NOT NULL DEFAULT \'\'';

    // Добавляем новый столбец в таблицу
    await query(
      `ALTER TABLE employees ADD COLUMN ${column_name} ${data_type} ${nullableClause}`
    );

    // Получаем максимальный порядок сортировки
    const maxOrder = await queryOne<{ max_order: number }>(
      'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM columns_metadata'
    );
    const nextOrder = (maxOrder?.max_order || 0) + 1;

    // Добавляем метаданные столбца
    await query(
      `INSERT INTO columns_metadata (column_name, display_name, is_visible, sort_order, admin_only)
       VALUES ($1, $2, $3, $4, $5)`,
      [column_name, display_name, true, nextOrder, admin_only || false]
    );

    // Логируем действие
    await logAdminAction({
      admin_username: admin.username,
      action_type: 'column_change',
      table_name: 'employees',
      description: `Добавлен новый столбец: ${display_name} (${column_name}, ${data_type})${admin_only ? ' [Только для админов]' : ''}`,
      new_values: { column_name, display_name, data_type, is_nullable, admin_only },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Столбец успешно добавлен',
      column_name 
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    console.error('Error adding column:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при добавлении столбца' },
      { status: 500 }
    );
  }
}

// Обновить метаданные столбца
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAuth();
    const { column_name, display_name, admin_only, is_visible } = await request.json();

    if (!column_name) {
      return NextResponse.json(
        { error: 'Название столбца обязательно' },
        { status: 400 }
      );
    }

    // Получаем старые метаданные для логирования
    const oldMetadata = await queryOne<any>(
      'SELECT * FROM columns_metadata WHERE column_name = $1',
      [column_name]
    );

    if (!oldMetadata) {
      return NextResponse.json(
        { error: 'Столбец не найден' },
        { status: 404 }
      );
    }

    // Обновляем метаданные
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramIndex}`);
      values.push(display_name);
      paramIndex++;
    }

    if (admin_only !== undefined) {
      updates.push(`admin_only = $${paramIndex}`);
      values.push(admin_only);
      paramIndex++;
    }

    if (is_visible !== undefined) {
      updates.push(`is_visible = $${paramIndex}`);
      values.push(is_visible);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Нет полей для обновления' },
        { status: 400 }
      );
    }

    values.push(column_name);

    await query(
      `UPDATE columns_metadata 
       SET ${updates.join(', ')}
       WHERE column_name = $${paramIndex}`,
      values
    );

    // Получаем обновленные метаданные
    const updatedMetadata = await queryOne<any>(
      'SELECT * FROM columns_metadata WHERE column_name = $1',
      [column_name]
    );

    // Логируем действие
    await logAdminAction({
      admin_username: admin.username,
      action_type: 'column_change',
      table_name: 'employees',
      description: `Обновлены настройки столбца: ${display_name || oldMetadata.display_name}`,
      old_values: oldMetadata,
      new_values: updatedMetadata,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Столбец успешно обновлен' 
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    console.error('Error updating column:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при обновлении столбца' },
      { status: 500 }
    );
  }
}

// Удалить столбец
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAuth();
    const { column_name } = await request.json();

    if (!column_name) {
      return NextResponse.json(
        { error: 'Название столбца обязательно' },
        { status: 400 }
      );
    }

    // Проверка на защищенные столбцы (обязательные)
    const protectedColumns = ['id', 'full_name', 'created_at', 'updated_at'];
    if (protectedColumns.includes(column_name)) {
      return NextResponse.json(
        { error: 'Этот столбец нельзя удалить' },
        { status: 400 }
      );
    }

    // Получаем метаданные для логирования
    const metadata = await queryOne<any>(
      'SELECT * FROM columns_metadata WHERE column_name = $1',
      [column_name]
    );

    // Удаляем столбец из таблицы
    await query(`ALTER TABLE employees DROP COLUMN ${column_name}`);

    // Удаляем метаданные столбца
    await query('DELETE FROM columns_metadata WHERE column_name = $1', [column_name]);

    // Логируем действие
    await logAdminAction({
      admin_username: admin.username,
      action_type: 'column_change',
      table_name: 'employees',
      description: `Удален столбец: ${metadata?.display_name || column_name} (${column_name})`,
      old_values: { column_name, metadata },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Столбец успешно удален' 
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    console.error('Error deleting column:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при удалении столбца' },
      { status: 500 }
    );
  }
}
