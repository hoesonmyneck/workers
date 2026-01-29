import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAdminAction } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await queryOne(
      'SELECT * FROM employees WHERE id = $1',
      [params.id]
    );

    if (!employee) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAuth();
    const body = await request.json();

    // Получаем старые данные для логирования
    const oldEmployee = await queryOne(
      'SELECT * FROM employees WHERE id = $1',
      [params.id]
    );

    if (!oldEmployee) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      );
    }

    // Фильтруем только разрешенные поля (исключаем системные)
    const excludeFields = ['id', 'created_at', 'updated_at'];
    const fields = Object.keys(body).filter(key => !excludeFields.includes(key));
    
    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'Нет полей для обновления' },
        { status: 400 }
      );
    }

    // Строим динамический SQL запрос
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fields.map(field => body[field]);
    values.push(params.id); // Добавляем ID в конец

    const result = await query(
      `UPDATE employees 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    const updatedEmployee = result[0];

    // Логируем действие
    await logAdminAction({
      admin_username: admin.username,
      action_type: 'update',
      table_name: 'employees',
      record_id: parseInt(params.id),
      old_values: oldEmployee,
      new_values: updatedEmployee,
      description: `Обновлены данные сотрудника: ${body.full_name || oldEmployee.full_name}`,
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении данных' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAuth();

    // Получаем данные для логирования
    const employee = await queryOne(
      'SELECT * FROM employees WHERE id = $1',
      [params.id]
    );

    if (!employee) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      );
    }

    await query('DELETE FROM employees WHERE id = $1', [params.id]);

    // Логируем действие
    await logAdminAction({
      admin_username: admin.username,
      action_type: 'delete',
      table_name: 'employees',
      record_id: parseInt(params.id),
      old_values: employee,
      description: `Удален сотрудник: ${employee.full_name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении сотрудника' },
      { status: 500 }
    );
  }
}
