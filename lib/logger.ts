import { query } from './db';

export interface LogAction {
  admin_username: string;
  action_type: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'filter_change' | 'column_change';
  table_name?: string;
  record_id?: number;
  old_values?: any;
  new_values?: any;
  description?: string;
  ip_address?: string;
}

export async function logAdminAction(action: LogAction): Promise<void> {
  try {
    await query(
      `INSERT INTO admin_logs 
       (admin_username, action_type, table_name, record_id, old_values, new_values, description, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        action.admin_username,
        action.action_type,
        action.table_name || null,
        action.record_id || null,
        action.old_values ? JSON.stringify(action.old_values) : null,
        action.new_values ? JSON.stringify(action.new_values) : null,
        action.description || null,
        action.ip_address || null,
      ]
    );
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

export async function getAdminLogs(limit: number = 100, offset: number = 0) {
  return query(
    `SELECT * FROM admin_logs 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
}

export async function getAdminLogsByUsername(username: string, limit: number = 50) {
  return query(
    `SELECT * FROM admin_logs 
     WHERE admin_username = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [username, limit]
  );
}
