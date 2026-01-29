'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface Employee {
  id: number;
  [key: string]: any;
}

interface ColumnMetadata {
  column_name: string;
  display_name: string;
  is_visible: boolean;
  sort_order: number;
  data_type: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [columns, setColumns] = useState<ColumnMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Record<string, any>>({});

  const loadEmployees = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '10000' });
    if (search) params.append('search', search);

    fetch(`/api/employees?${params}`)
      .then(res => res.json())
      .then(data => {
        setEmployees(data.employees);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading employees:', err);
        setLoading(false);
      });
  };

  const loadColumns = () => {
    fetch('/api/columns?admin=true')
      .then(res => res.json())
      .then(data => {
        const visibleColumns = data.columns.filter((col: any) => col.is_visible);
        setColumns(visibleColumns);
      })
      .catch(err => console.error('Error loading columns:', err));
  };

  useEffect(() => {
    loadColumns();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(loadEmployees, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setEditForm(employee);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const res = await fetch(`/api/employees/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setEditingId(null);
        setEditForm({});
        loadEmployees();
      } else {
        alert('Ошибка при сохранении');
      }
    } catch (err) {
      alert('Ошибка при сохранении');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Удалить сотрудника "${name}"?`)) return;

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadEmployees();
      } else {
        alert('Ошибка при удалении');
      }
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const handleAdd = async () => {
    if (!addForm.full_name) {
      alert('ФИО обязательно');
      return;
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      if (res.ok) {
        setShowAddForm(false);
        setAddForm({});
        loadEmployees();
        loadColumns(); // Перезагружаем столбцы на случай если структура изменилась
      } else {
        alert('Ошибка при добавлении');
      }
    } catch (err) {
      alert('Ошибка при добавлении');
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление сотрудниками</h1>
          <p className="text-gray-600 mt-2">
            Добавление, редактирование и удаление записей
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить сотрудника
        </Button>
      </div>

      {/* Форма добавления */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Новый сотрудник</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.map((column) => {
                const isRequired = column.column_name === 'full_name';
                const inputType = 
                  column.data_type.includes('date') ? 'date' :
                  column.column_name === 'email' ? 'email' :
                  column.data_type.includes('integer') || column.data_type.includes('decimal') ? 'number' :
                  'text';

                return (
                  <Input
                    key={column.column_name}
                    placeholder={`${column.display_name}${isRequired ? ' *' : ''}`}
                    type={inputType}
                    value={addForm[column.column_name] || ''}
                    onChange={(e) => setAddForm({ ...addForm, [column.column_name]: e.target.value })}
                  />
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAdd}>Сохранить</Button>
              <Button variant="outline" onClick={() => {
                setShowAddForm(false);
                setAddForm({});
              }}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Поиск */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск по ФИО, email, телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Таблица */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Сотрудники ({employees.length})</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const container = document.getElementById('employees-table-container');
                  if (container) {
                    container.scrollLeft -= 200;
                  }
                }}
              >
                ← Влево
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const container = document.getElementById('employees-table-container');
                  if (container) {
                    container.scrollLeft += 200;
                  }
                }}
              >
                Вправо →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Загрузка...</p>
            </div>
          ) : (
            <div id="employees-table-container" className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.column_name}>
                        {column.display_name}
                      </TableHead>
                    ))}
                    <TableHead className="w-32">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      {editingId === employee.id ? (
                        <>
                          {columns.map((column) => {
                            const inputType = 
                              column.data_type.includes('date') ? 'date' :
                              column.column_name === 'email' ? 'email' :
                              column.data_type.includes('integer') || column.data_type.includes('decimal') ? 'number' :
                              'text';

                            return (
                              <TableCell key={column.column_name}>
                                <Input
                                  type={inputType}
                                  value={editForm[column.column_name] || ''}
                                  onChange={(e) => setEditForm({ ...editForm, [column.column_name]: e.target.value })}
                                  className="min-w-[120px]"
                                />
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={handleSaveEdit}>
                                Сохр.
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setEditingId(null);
                                  setEditForm({});
                                }}
                              >
                                Отм.
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          {columns.map((column) => (
                            <TableCell 
                              key={column.column_name}
                              className={column.column_name === 'full_name' ? 'font-medium' : ''}
                            >
                              {employee[column.column_name] || '-'}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(employee.id, employee.full_name)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
