import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Получаем статистику за сегодня из логов
    const todayStats = await query(`
      SELECT 
        COUNT(CASE WHEN action_type = 'create' AND table_name = 'employees' THEN 1 END) as added_today,
        COUNT(CASE WHEN action_type = 'update' AND table_name = 'employees' THEN 1 END) as updated_today
      FROM admin_logs
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    const stats = todayStats[0] || { added_today: 0, updated_today: 0 };

    return NextResponse.json({
      addedToday: parseInt(stats.added_today) || 0,
      updatedToday: parseInt(stats.updated_today) || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
}
