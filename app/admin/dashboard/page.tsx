'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Briefcase, Calendar } from 'lucide-react';

interface Stats {
  totalEmployees: number;
  totalDepartments: number;
  totalPositions: number;
  addedToday: number;
  updatedToday: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    totalDepartments: 0,
    totalPositions: 0,
    addedToday: 0,
    updatedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/employees?limit=1000').then(res => res.json()),
      fetch('/api/filters').then(res => res.json()),
      fetch('/api/stats').then(res => res.json()),
    ])
      .then(([employeesData, filtersData, statsData]) => {
        setStats({
          totalEmployees: employeesData.pagination.total,
          totalDepartments: filtersData.departments.length,
          totalPositions: filtersData.positions.length,
          addedToday: statsData.addedToday || 0,
          updatedToday: statsData.updatedToday || 0,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading stats:', err);
        setLoading(false);
      });
  }, []);

  const statCards = [
    {
      title: 'Всего сотрудников',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Департаментов',
      value: stats.totalDepartments,
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Должностей',
      value: stats.totalPositions,
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
        <p className="text-gray-600 mt-2">
          Обзор справочника сотрудников АО ЦРТР
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Загрузка статистики...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Обновления сегодня */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Обновления сегодня
              </CardTitle>
              <CardDescription>
                Изменения в справочнике за {new Date().toLocaleDateString('ru-RU')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                    <span className="text-2xl">➕</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Добавлено новых</p>
                    <p className="text-3xl font-bold text-green-700">{stats.addedToday}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                    <span className="text-2xl">✏️</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Изменено существующих</p>
                    <p className="text-3xl font-bold text-blue-700">{stats.updatedToday}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
              <CardDescription>
                Часто используемые функции администрирования
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="/admin/employees"
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-6 w-6 text-blue-600 mb-2" />
                  <h3 className="font-medium mb-1">Управление сотрудниками</h3>
                  <p className="text-sm text-gray-600">
                    Добавление, редактирование и удаление записей
                  </p>
                </a>

                <a
                  href="/admin/logs"
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="h-6 w-6 text-green-600 mb-2" />
                  <h3 className="font-medium mb-1">Логи действий</h3>
                  <p className="text-sm text-gray-600">
                    Просмотр истории изменений
                  </p>
                </a>

                <a
                  href="/"
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  target="_blank"
                >
                  <Building2 className="h-6 w-6 text-purple-600 mb-2" />
                  <h3 className="font-medium mb-1">Публичный справочник</h3>
                  <p className="text-sm text-gray-600">
                    Открыть справочник для просмотра
                  </p>
                </a>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
