'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, Phone, Mail, LogIn } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Employee {
  id: number;
  number: number | null;
  position: string | null;
  full_name: string;
  department: string | null;
  office_number: string | null;
  internal_phone: string | null;
  email: string | null;
  mobile_phone: string | null;
  birthday: string | null;
}

interface Filters {
  departments: string[];
  offices: string[];
  positions: string[];
}

interface ColumnMetadata {
  column_name: string;
  display_name: string;
  is_visible: boolean;
  sort_order: number;
}

export default function HomePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<Filters>({ departments: [], offices: [], positions: [] });
  const [columns, setColumns] = useState<ColumnMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Проверка авторизации
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.admin) {
          setIsAdmin(true);
        }
      })
      .catch(() => setIsAdmin(false));
  }, []);

  // Загрузка фильтров
  useEffect(() => {
    fetch('/api/filters')
      .then(res => res.json())
      .then(data => setFilters(data))
      .catch(err => console.error('Error loading filters:', err));
  }, []);

  // Загрузка метаданных столбцов
  useEffect(() => {
    // Если админ, то получаем все столбцы, иначе только публичные
    const apiUrl = isAdmin ? '/api/columns?admin=true' : '/api/columns';
    
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        const visibleColumns = data.columns.filter((col: any) => col.is_visible);
        setColumns(visibleColumns);
      })
      .catch(err => console.error('Error loading columns:', err));
  }, [isAdmin]);

  // Загрузка сотрудников (все записи, без пагинации)
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: '10000', // Загружаем все записи
    });

    if (search) params.append('search', search);
    if (selectedDepartment) params.append('department', selectedDepartment);
    if (selectedOffice) params.append('office', selectedOffice);
    if (selectedPosition) params.append('position', selectedPosition);

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
  }, [search, selectedDepartment, selectedOffice, selectedPosition]);

  const resetFilters = () => {
    setSearch('');
    setSelectedDepartment('');
    setSelectedOffice('');
    setSelectedPosition('');
  };

  const renderCellValue = (employee: any, columnName: string) => {
    const value = employee[columnName];
    
    if (!value) return '-';

    // Специальная обработка для определенных типов данных
    if (columnName === 'email') {
      return (
        <a
          href={`mailto:${value}`}
          className="flex items-center gap-1 text-blue-600 hover:underline"
        >
          <Mail className="h-3 w-3" />
          {value}
        </a>
      );
    }

    if (columnName === 'mobile_phone') {
      return (
        <a
          href={`tel:${value}`}
          className="flex items-center gap-1 text-blue-600 hover:underline"
        >
          <Phone className="h-3 w-3" />
          {value}
        </a>
      );
    }

    if (columnName === 'internal_phone') {
      return (
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3 text-gray-400" />
          {value}
        </div>
      );
    }

    return value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image 
              src="/logo.jpg" 
              alt="Логотип АО ЦРТР" 
              width={60} 
              height={60}
              className="flex-shrink-0 rounded"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Справочник сотрудников</h1>
              <p className="text-sm text-gray-600">АО "Центр развития трудовых ресурсов"</p>
            </div>
          </div>
          <Link href={isAdmin ? "/admin/dashboard" : "/admin/login"}>
            <Button variant={isAdmin ? "default" : "outline"} className="gap-2">
              <LogIn className="h-4 w-4" />
              {isAdmin ? "Админ панель" : "Вход для администраторов"}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Поиск и фильтры
            </CardTitle>
            <CardDescription>
              Используйте поиск или фильтры для быстрого нахождения сотрудников
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Поиск */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Поиск по ФИО, email, телефону, должности..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Фильтр по департаменту */}
              <div>
                <SearchableSelect
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                  options={filters.departments}
                  placeholder="Все департаменты"
                />
              </div>

              {/* Фильтр по кабинету */}
              <div>
                <SearchableSelect
                  value={selectedOffice}
                  onValueChange={setSelectedOffice}
                  options={filters.offices}
                  placeholder="Все кабинеты"
                />
              </div>
            </div>

            {/* Дополнительные фильтры */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <SearchableSelect
                  value={selectedPosition}
                  onValueChange={setSelectedPosition}
                  options={filters.positions}
                  placeholder="Все должности"
                />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Таблица сотрудников */}
        <Card>
          <CardHeader>
            <CardTitle>Сотрудники ({employees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Загрузка...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Сотрудники не найдены</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead 
                          key={column.column_name}
                          className={
                            column.column_name === 'number' ? 'w-12' :
                            column.column_name === 'office_number' ? 'w-24' :
                            column.column_name === 'internal_phone' ? 'w-24' :
                            column.column_name === 'mobile_phone' ? 'w-36' :
                            ''
                          }
                        >
                          {column.display_name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        {columns.map((column) => (
                          <TableCell 
                            key={column.column_name}
                            className={
                              column.column_name === 'full_name' ? 'font-medium' :
                              column.column_name === 'number' ? 'font-medium' :
                              column.column_name === 'office_number' ? 'text-sm text-center' :
                              'text-sm'
                            }
                          >
                            {renderCellValue(employee, column.column_name)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>&copy; 2025 АО "Центр развития трудовых ресурсов". Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
