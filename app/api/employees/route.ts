import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAdminAction } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const office = searchParams.get('office') || '';
    const position = searchParams.get('position') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        full_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        mobile_phone ILIKE $${paramIndex} OR
        position ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (department) {
      whereConditions.push(`department = $${paramIndex}`);
      queryParams.push(department);
      paramIndex++;
    }

    if (office) {
      whereConditions.push(`office_number = $${paramIndex}`);
      queryParams.push(office);
      paramIndex++;
    }

    if (position) {
      whereConditions.push(`position = $${paramIndex}`);
      queryParams.push(position);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Получаем общее количество записей
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM employees ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult?.count || '0');

    // Получаем все данные (без пагинации), сортировка по номеру для сохранения иерархии
    const employees = await query(
      `SELECT * FROM employees 
       ${whereClause}
       ORDER BY 
         CASE WHEN number IS NULL THEN 1 ELSE 0 END,
         number ASC`,
      queryParams
    );

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth();
    const body = await request.json();

    if (!body.full_name) {
      return NextResponse.json(
        { error: 'ФИО обязательно' },
        { status: 400 }
      );
    }

    // Фильтруем только разрешенные поля (исключаем системные)
    const excludeFields = ['id', 'created_at', 'updated_at'];
    const fields = Object.keys(body).filter(key => !excludeFields.includes(key) && body[key] !== undefined);
    
    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'Нет полей для создания' },
        { status: 400 }
      );
    }

    // Строим динамический SQL запрос
    const columns = fields.join(', ');
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const values = fields.map(field => body[field]);

    const result = await query(
      `INSERT INTO employees (${columns})
       VALUES (${placeholders})
       RETURNING *`,
      values
    );

    const newEmployee = result[0];

    // Логируем действие
    await logAdminAction({
      admin_username: admin.username,
      action_type: 'create',
      table_name: 'employees',
      record_id: newEmployee.id,
      new_values: newEmployee,
      description: `Добавлен новый сотрудник: ${body.full_name}`,
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании сотрудника' },
      { status: 500 }
    );
  }
}
