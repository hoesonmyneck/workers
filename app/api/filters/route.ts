import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Получаем уникальные значения для фильтров
    const [departments, offices, positions] = await Promise.all([
      query('SELECT DISTINCT department FROM employees WHERE department IS NOT NULL ORDER BY department'),
      query('SELECT DISTINCT office_number FROM employees WHERE office_number IS NOT NULL ORDER BY office_number'),
      query('SELECT DISTINCT position FROM employees WHERE position IS NOT NULL ORDER BY position'),
    ]);

    return NextResponse.json({
      departments: departments.map((d: any) => d.department),
      offices: offices.map((o: any) => o.office_number),
      positions: positions.map((p: any) => p.position),
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении фильтров' },
      { status: 500 }
    );
  }
}
