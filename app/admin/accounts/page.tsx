'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Eye, EyeOff, Shield, User } from 'lucide-react';

interface Admin {
  id: number;
  username: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function AccountsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'admin',
  });

  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'admin',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = () => {
    setLoading(true);
    fetch('/api/admins')
      .then(res => {
        if (res.status === 403) {
          setError('Доступ запрещен. Требуются права владельца');
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.admins) {
          setAdmins(data.admins);
        } else {
          setAdmins([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading admins:', err);
        setError('Ошибка при загрузке администраторов');
        setAdmins([]);
        setLoading(false);
      });
  };

  const handleAddAdmin = async () => {
    setError('');
    setSuccess('');

    if (!newAdmin.username || !newAdmin.password) {
      setError('Логин и пароль обязательны');
      return;
    }

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка при создании администратора');
        return;
      }

      setSuccess('Администратор успешно создан!');
      setShowAddForm(false);
      setNewAdmin({
        username: '',
        password: '',
        full_name: '',
        role: 'admin',
      });
      loadAdmins();
    } catch (err) {
      setError('Ошибка при создании администратора');
    }
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingId(admin.id);
    setEditForm({
      username: admin.username,
      password: '',
      full_name: admin.full_name,
      role: admin.role,
    });
    setError('');
    setSuccess('');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admins/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка при обновлении администратора');
        return;
      }

      setSuccess('Администратор успешно обновлен!');
      setEditingId(null);
      setEditForm({ email: '', password: '', full_name: '', role: 'admin' });
      loadAdmins();
    } catch (err) {
      setError('Ошибка при обновлении администратора');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ username: '', password: '', full_name: '', role: 'admin' });
    setError('');
  };

  const handleDeleteAdmin = async (id: number, username: string) => {
    if (!confirm(`Вы уверены, что хотите удалить администратора ${username}?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admins/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка при удалении администратора');
        return;
      }

      setSuccess('Администратор успешно удален!');
      loadAdmins();
    } catch (err) {
      setError('Ошибка при удалении администратора');
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getRoleBadge = (role: string) => {
    if (role === 'owner') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
          <Shield className="h-3 w-3" />
          Владелец
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
        <User className="h-3 w-3" />
        Администратор
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Управление аккаунтами</h1>
          <p className="text-gray-600 mt-2">
            Создание, редактирование и удаление администраторов
          </p>
        </div>
        <Button onClick={() => {
          setShowAddForm(!showAddForm);
          setError('');
          setSuccess('');
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить администратора
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
          <span className="text-red-500 mt-0.5">⚠️</span>
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
            <CardTitle>Добавить нового администратора</CardTitle>
            <CardDescription>
              Все поля обязательны для заполнения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Логин *
                </label>
                <Input
                  type="text"
                  placeholder="admin"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Полное имя
                </label>
                <Input
                  placeholder="Имя Фамилия"
                  value={newAdmin.full_name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Пароль *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword['new'] ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword['new'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Роль *
                </label>
                <Select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                >
                  <option value="admin">Администратор</option>
                  <option value="owner">Владелец</option>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddAdmin}>Создать администратора</Button>
              <Button variant="outline" onClick={() => {
                setShowAddForm(false);
                setError('');
                setNewAdmin({ username: '', password: '', full_name: '', role: 'admin' });
              }}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список администраторов */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>Список администраторов</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const container = document.getElementById('admins-table-container');
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
                  const container = document.getElementById('admins-table-container');
                  if (container) {
                    container.scrollLeft += 200;
                  }
                }}
              >
                Вправо →
              </Button>
            </div>
          </div>
          <CardDescription>
            Аккаунты владельцев выделены цветом и защищены от удаления
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Загрузка...</p>
            </div>
          ) : (
            <div id="admins-table-container" className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Логин</TableHead>
                  <TableHead>Полное имя</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="w-32">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins && admins.length > 0 && admins.map((admin) => {
                  const isEditing = editingId === admin.id;
                  const isOwner = admin.role === 'owner';

                  return (
                    <TableRow 
                      key={admin.id}
                      className={isOwner ? 'bg-purple-50' : ''}
                    >
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          />
                        ) : (
                          <span className="font-medium">{admin.username}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          />
                        ) : (
                          <span>{admin.full_name || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          >
                            <option value="admin">Администратор</option>
                            <option value="owner">Владелец</option>
                          </Select>
                        ) : (
                          getRoleBadge(admin.role)
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(admin.created_at).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="relative">
                              <Input
                                type={showPassword[`edit-${admin.id}`] ? 'text' : 'password'}
                                placeholder="Новый пароль (оставьте пустым, чтобы не менять)"
                                value={editForm.password}
                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(`edit-${admin.id}`)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showPassword[`edit-${admin.id}`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={handleSaveEdit}>
                                Сохранить
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                Отмена
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditAdmin(admin)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                              disabled={isOwner}
                              title={isOwner ? 'Нельзя удалить владельца' : 'Удалить'}
                            >
                              <Trash2 className={`h-4 w-4 ${isOwner ? 'text-gray-300' : 'text-red-600'}`} />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}

          {!loading && (!admins || admins.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500">Нет администраторов</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Информационная панель */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">ℹ️ Информация</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p><strong>Владелец (Owner):</strong> Полный доступ ко всем функциям, включая управление аккаунтами</p>
          <p><strong>Администратор (Admin):</strong> Может управлять сотрудниками и столбцами, но не может управлять аккаунтами</p>
          <p><strong>Защита:</strong> Нельзя удалить или редактировать свой собственный аккаунт</p>
          <p><strong>Пароли:</strong> При редактировании оставьте поле пароля пустым, чтобы не менять его</p>
        </CardContent>
      </Card>
    </div>
  );
}
