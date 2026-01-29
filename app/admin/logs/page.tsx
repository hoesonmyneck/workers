'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { FileText, RefreshCw } from 'lucide-react';

interface Log {
  id: number;
  admin_username: string;
  action_type: string;
  table_name: string | null;
  record_id: number | null;
  old_values: any;
  new_values: any;
  description: string | null;
  ip_address: string | null;
  created_at: string;
}

const actionTypeLabels: Record<string, string> = {
  create: 'Создание',
  update: 'Обновление',
  delete: 'Удаление',
  login: 'Вход',
  logout: 'Выход',
  filter_change: 'Изменение фильтра',
  column_change: 'Изменение столбца',
};

const actionTypeColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-gray-100 text-gray-800',
  filter_change: 'bg-yellow-100 text-yellow-800',
  column_change: 'bg-orange-100 text-orange-800',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = () => {
    setLoading(true);
    fetch(`/api/logs?page=${currentPage}&limit=50`)
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs);
        setTotalPages(data.pagination.pages);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading logs:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage]);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Логи действий</h1>
          <p className="text-gray-600 mt-2">
            История всех действий администраторов в системе
          </p>
        </div>
        <Button onClick={loadLogs} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Обновить
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            История действий
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Загрузка логов...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Логи отсутствуют</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Дата и время</TableHead>
                      <TableHead>Администратор</TableHead>
                      <TableHead className="w-[120px]">Действие</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead className="w-[100px]">Таблица</TableHead>
                      <TableHead className="w-[80px]">ID записи</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.admin_username}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              actionTypeColors[log.action_type] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {actionTypeLabels[log.action_type] || log.action_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.description || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.table_name || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          {log.record_id || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Предыдущая
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Страница {currentPage} из {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Следующая
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Легенда */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Типы действий</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(actionTypeLabels).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    actionTypeColors[type]
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
