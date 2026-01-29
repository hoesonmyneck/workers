'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, AlertCircle, Edit } from 'lucide-react';

interface Column {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  display_name: string;
  is_visible: boolean;
  sort_order: number;
  admin_only: boolean;
}

const dataTypes = [
  { value: 'VARCHAR(255)', label: 'Текст (255 символов)' },
  { value: 'TEXT', label: 'Длинный текст' },
  { value: 'INTEGER', label: 'Целое число' },
  { value: 'DECIMAL(10,2)', label: 'Число с дробной частью' },
  { value: 'DATE', label: 'Дата' },
  { value: 'TIMESTAMP', label: 'Дата и время' },
  { value: 'BOOLEAN', label: 'Да/Нет' },
];

const protectedColumns = ['id', 'full_name', 'created_at', 'updated_at'];


export default function ColumnsPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newColumn, setNewColumn] = useState({
    column_name: '',
    display_name: '',
    data_type: 'VARCHAR(255)',
    is_nullable: true,
    admin_only: false,
  });
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    display_name: string;
    admin_only: boolean;
  }>({
    display_name: '',
    admin_only: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadColumns = () => {
    setLoading(true);
    fetch('/api/columns?admin=true')
      .then(res => res.json())
      .then(data => {
        setColumns(data.columns);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading columns:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadColumns();
  }, []);

  const handleAddColumn = async () => {
    setError('');
    setSuccess('');

    if (!newColumn.column_name) {
      setError('Введите название столбца');
      return;
    }

    if (!newColumn.display_name) {
      setError('Введите русское название столбца');
      return;
    }

    try {
      const res = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newColumn),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка при добавлении столбца');
        return;
      }

      setSuccess('Столбец успешно добавлен!');
      setShowAddForm(false);
      setNewColumn({
        column_name: '',
        display_name: '',
        data_type: 'VARCHAR(255)',
        is_nullable: true,
        admin_only: false,
      });
      loadColumns();
    } catch (err) {
      setError('Ошибка при добавлении столбца');
    }
  };

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column.column_name);
    setEditForm({
      display_name: column.display_name,
      admin_only: column.admin_only,
    });
    setError('');
    setSuccess('');
  };

  const handleSaveEdit = async () => {
    if (!editingColumn) return;

    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/columns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column_name: editingColumn,
          ...editForm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка при обновлении столбца');
        return;
      }

      setSuccess('Столбец успешно обновлен!');
      setEditingColumn(null);
      setEditForm({ display_name: '', admin_only: false });
      loadColumns();
    } catch (err) {
      setError('Ошибка при обновлении столбца');
    }
  };

  const handleCancelEdit = () => {
    setEditingColumn(null);
    setEditForm({ display_name: '', admin_only: false });
    setError('');
  };

  const handleDeleteColumn = async (columnName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить столбец "${columnName}"?\n\nВсе данные в этом столбце будут потеряны!`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/columns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_name: columnName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка при удалении столбца');
        return;
      }

      setSuccess('Столбец успешно удален!');
      loadColumns();
    } catch (err) {
      setError('Ошибка при удалении столбца');
    }
  };

  const canDelete = (columnName: string) => {
    return !protectedColumns.includes(columnName);
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление столбцами</h1>
          <p className="text-gray-600 mt-2">
            Добавление и удаление столбцов в таблице сотрудников
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить столбец
        </Button>
      </div>

      {/* Уведомления */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Форма добавления */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Добавить новый столбец</CardTitle>
            <CardDescription>
              Название должно содержать только строчные латинские буквы, цифры и подчеркивания
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название столбца (на английском) *
                </label>
                <Input
                  placeholder="например: marital_status"
                  value={newColumn.column_name}
                  onChange={(e) => setNewColumn({ ...newColumn, column_name: e.target.value.toLowerCase() })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Только латинские буквы, цифры и подчеркивания
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Русское название *
                </label>
                <Input
                  placeholder="например: Семейное положение"
                  value={newColumn.display_name}
                  onChange={(e) => setNewColumn({ ...newColumn, display_name: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Это название будет отображаться в таблице
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Тип данных *
                </label>
                <Select
                  value={newColumn.data_type}
                  onChange={(e) => setNewColumn({ ...newColumn, data_type: e.target.value })}
                >
                  {dataTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Обязательное поле
                </label>
                <Select
                  value={newColumn.is_nullable ? 'yes' : 'no'}
                  onChange={(e) => setNewColumn({ ...newColumn, is_nullable: e.target.value === 'yes' })}
                >
                  <option value="yes">Нет (можно оставить пустым)</option>
                  <option value="no">Да (обязательно для заполнения)</option>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newColumn.admin_only}
                  onChange={(e) => setNewColumn({ ...newColumn, admin_only: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">
                  Только для администраторов
                </span>
                <span className="text-xs text-gray-500">
                  (столбец будет виден только авторизованным админам)
                </span>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddColumn}>Добавить столбец</Button>
              <Button variant="outline" onClick={() => {
                setShowAddForm(false);
                setError('');
              }}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список столбцов */}
      <Card>
        <CardHeader>
          <CardTitle>Текущие столбцы</CardTitle>
          <CardDescription>
            Столбцы выделенные серым нельзя удалить (системные)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Загрузка...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название столбца</TableHead>
                  <TableHead>Русское название</TableHead>
                  <TableHead>Тип данных</TableHead>
                  <TableHead>Доступ</TableHead>
                  <TableHead className="w-32">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((column) => {
                  const isProtected = protectedColumns.includes(column.column_name);
                  const isEditing = editingColumn === column.column_name;

                  return (
                    <TableRow 
                      key={column.column_name}
                      className={isProtected ? 'bg-gray-50' : ''}
                    >
                      <TableCell className="font-mono text-sm">
                        {column.column_name}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm.display_name}
                            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                            className="max-w-xs"
                          />
                        ) : (
                          <span className="font-medium">{column.display_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {column.data_type.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.admin_only}
                              onChange={(e) => setEditForm({ ...editForm, admin_only: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span className="text-xs">Только админы</span>
                          </label>
                        ) : (
                          <>
                            {column.admin_only ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                🔒 Только админы
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                👁️ Все
                              </span>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={handleSaveEdit}>
                              Сохр.
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              Отм.
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditColumn(column)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {canDelete(column.column_name) ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteColumn(column.column_name)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400 px-2">Защищен</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Предупреждение */}
      <Card className="mt-6 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Важная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700 space-y-2">
          <p><strong>Перед удалением столбца:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Все данные в этом столбце будут безвозвратно удалены</li>
            <li>Убедитесь, что столбец действительно не нужен</li>
            <li>Рекомендуется сделать резервную копию базы данных</li>
          </ul>
          <p className="mt-4"><strong>При добавлении столбца:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Используйте понятные названия на английском языке</li>
            <li>Выберите подходящий тип данных</li>
            <li>Для существующих сотрудников значение будет пустым</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
