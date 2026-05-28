'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, SortableTableHead, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { 
  User, 
  Car, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Layers, 
  Briefcase,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { useSortableTable } from '@/hooks/use-sortable-table';
import Link from 'next/link';

interface Driver {
  id: number;
  name: string;
  phone: string;
  vehiclePlate: string;
}

interface SalaryExpense {
  id: number;
  category: 'driver_salary';
  amountRub: number;
  note: string | null;
  driverId: number | null;
  recordedAt: Date | string;
}

interface DriverSalaryTrackerProps {
  dict: any;
  drivers: Driver[];
  expenses: SalaryExpense[];
}

export function DriverSalaryTracker({ dict, drivers, expenses }: DriverSalaryTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDriverId, setExpandedDriverId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'drivers' | 'all'>('drivers');

  // Filter drivers based on search term
  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics for each driver
  const driverStats = drivers.map(driver => {
    const driverExpenses = expenses.filter(exp => exp.driverId === driver.id);
    const totalCost = driverExpenses.reduce((sum, exp) => sum + exp.amountRub, 0);
    
    return {
      ...driver,
      expensesList: driverExpenses,
      totalCost,
      count: driverExpenses.length
    };
  });

  // Calculate overall metrics
  const unassignedExpensesList = expenses.filter(exp => exp.driverId === null);
  const unassignedCost = unassignedExpensesList.reduce((sum, exp) => sum + exp.amountRub, 0);
  const totalCostAll = expenses.reduce((sum, exp) => sum + exp.amountRub, 0);

  // Filtered master ledger expenses
  const filteredAllExpenses = expenses.filter(exp => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const driver = drivers.find(d => d.id === exp.driverId);
    return (
      (exp.note || '').toLowerCase().includes(term) ||
      (driver?.name || '').toLowerCase().includes(term) ||
      (driver?.vehiclePlate || '').toLowerCase().includes(term)
    );
  });

  const { sortedData: sortedAllExpenses, sortKey, sortDirection, toggleSort } = useSortableTable(filteredAllExpenses);

  return (
    <div className="space-y-6">
      {/* Search and Tab Toggle Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100/80">
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'drivers' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            } flex-1 md:flex-initial`}
          >
            <User className="h-4.5 w-4.5" />
            По водителям (Зарплата)
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'all' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            } flex-1 md:flex-initial`}
          >
            <Layers className="h-4.5 w-4.5" />
            Все выплаты
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <Input
            placeholder="Поиск по водителю..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <Briefcase className="h-40 w-40 text-blue-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              Всего выплат
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 flex items-baseline gap-1.5">
              {expenses.length}
              <span className="text-base font-semibold text-slate-500">вып.</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Количество транзакций по зарплате</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl bg-gradient-to-br from-rose-500/5 to-pink-500/5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <DollarSign className="h-40 w-40 text-rose-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              {dict.driver_salary || 'Зарплата водителя'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 flex items-baseline gap-1.5">
              {totalCostAll.toLocaleString()}
              <span className="text-base font-semibold text-slate-500">RUB</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Общая сумма выплаченных зарплат</p>
          </CardContent>
        </Card>
      </div>

      {/* Primary Views */}
      {activeTab === 'drivers' ? (
        <div className="space-y-4">
          {filteredDrivers.map(driver => {
            const stats = driverStats.find(s => s.id === driver.id)!;
            const isExpanded = expandedDriverId === driver.id;

            return (
              <Card 
                key={driver.id} 
                className={`border-0 shadow-sm ring-1 transition-all rounded-2xl overflow-hidden bg-white hover:ring-slate-300/80 ${
                  isExpanded ? 'ring-primary/40 shadow-md shadow-primary/5' : 'ring-slate-100'
                }`}
              >
                {/* Driver summary bar */}
                <div 
                  onClick={() => setExpandedDriverId(isExpanded ? null : driver.id)}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-4.5">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-inner">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{driver.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 font-semibold">{driver.phone}</span>
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider border border-slate-200">
                          <Car className="h-3 w-3" />
                          {driver.vehiclePlate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-6">
                      <div className="text-right flex flex-col items-end">
                        <span className="text-xs text-slate-400 font-semibold block">Сумма</span>
                        <span className="font-extrabold text-blue-600">{stats.totalCost.toLocaleString()} RUB</span>
                        <span className="inline-flex items-center text-[9px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded mt-1 shadow-sm">
                          {totalCostAll > 0 ? Math.round((stats.totalCost / totalCostAll) * 100) : 0}% {dict.fuel === "Топливо" ? "от категории" : "bo'limdan"}
                        </span>
                      </div>
                      <div className="text-right hidden md:block">
                        <span className="text-xs text-slate-400 font-semibold block">Выплаты</span>
                        <span className="font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full text-xs">{stats.count}</span>
                      </div>
                    </div>
                    
                    <div className="text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Ledger view */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">История выплат водителю</h4>
                      <span className="text-xs text-slate-400 font-medium">Всего {stats.count} выплат</span>
                    </div>

                    <div className="bg-white rounded-xl overflow-hidden ring-1 ring-slate-100 shadow-inner">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="w-[120px]">Дата</TableHead>
                            <TableHead className="w-[120px]">Категория</TableHead>
                            <TableHead>Описание</TableHead>
                            <TableHead className="text-right w-[150px]">Сумма</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.expensesList.slice(0, 5).map(exp => (
                            <TableRow key={exp.id} className="hover:bg-slate-50/50">
                              <TableCell className="text-xs text-slate-500 font-medium">
                                {format(new Date(exp.recordedAt), 'dd.MM.yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <span className="capitalize text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md inline-flex">
                                  {dict[exp.category] || exp.category}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs font-semibold text-slate-700">
                                {exp.note || '-'}
                              </TableCell>
                              <TableCell className="text-right text-sm text-blue-600 font-extrabold">
                                -{exp.amountRub.toLocaleString()} RUB
                              </TableCell>
                              <TableCell className="text-right">
                                <ExpenseForm dict={dict} expense={exp} drivers={drivers} />
                              </TableCell>
                            </TableRow>
                          ))}
                          {stats.expensesList.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-slate-400 font-medium">
                                Нет записей о зарплате для этого водителя.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      {stats.expensesList.length > 5 && (
                        <div className="flex justify-center p-3.5 bg-slate-50/50 border-t border-slate-100">
                          <Link href={`/drivers/${driver.id}/driver_salary`} className="w-full sm:w-auto">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 hover:bg-slate-100/80 px-4 py-1.5 rounded-lg transition-all w-full"
                            >
                              <Layers className="h-4 w-4" />
                              Показать все ({stats.expensesList.length})
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {unassignedExpensesList.length > 0 && (
            <Card 
              className={`border-0 shadow-sm ring-1 transition-all rounded-2xl overflow-hidden bg-white hover:ring-slate-300/80 ${
                expandedDriverId === -1 ? 'ring-slate-300 shadow-md' : 'ring-slate-100'
              }`}
            >
              {/* Unassigned summary bar */}
              <div 
                onClick={() => setExpandedDriverId(expandedDriverId === -1 ? null : -1)}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-4.5">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shadow-inner">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-700">Общие / Не распределено</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400 font-semibold">Общие корпоративные расходы</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-6">
                    <div className="text-right flex flex-col items-end">
                      <span className="text-xs text-slate-400 font-semibold block">Сумма</span>
                      <span className="font-extrabold text-slate-700">{unassignedCost.toLocaleString()} RUB</span>
                      <span className="inline-flex items-center text-[9px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded mt-1 shadow-sm">
                        {totalCostAll > 0 ? Math.round((unassignedCost / totalCostAll) * 100) : 0}% {dict.fuel === "Топливо" ? "от категории" : "bo'limdan"}
                      </span>
                    </div>
                    <div className="text-right hidden md:block">
                      <span className="text-xs text-slate-400 font-semibold block">Записи</span>
                      <span className="font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full text-xs">{unassignedExpensesList.length}</span>
                    </div>
                  </div>
                  
                  <div className="text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    {expandedDriverId === -1 ? <ChevronUp className="h-5 w-5 text-slate-600" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Ledger view */}
              {expandedDriverId === -1 && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">История нераспределенных выплат</h4>
                    <span className="text-xs text-slate-400 font-medium">Всего {unassignedExpensesList.length} записей</span>
                  </div>

                  <div className="bg-white rounded-xl overflow-hidden ring-1 ring-slate-100 shadow-inner">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[120px]">Дата</TableHead>
                          <TableHead className="w-[120px]">Категория</TableHead>
                          <TableHead>Описание</TableHead>
                          <TableHead className="text-right w-[150px]">Сумма</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unassignedExpensesList.map(exp => (
                          <TableRow key={exp.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-xs text-slate-500 font-medium">
                              {format(new Date(exp.recordedAt), 'dd.MM.yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <span className="capitalize text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md inline-flex">
                                {dict[exp.category] || exp.category}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-slate-700">
                              {exp.note || '-'}
                            </TableCell>
                            <TableCell className="text-right text-sm text-blue-600 font-extrabold">
                              -{exp.amountRub.toLocaleString()} RUB
                            </TableCell>
                            <TableCell className="text-right">
                              <ExpenseForm dict={dict} expense={exp} drivers={drivers} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </Card>
          )}

          {filteredDrivers.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border-0 ring-1 ring-slate-100 text-center flex flex-col items-center justify-center">
              <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
              <h3 className="font-bold text-lg text-slate-700">Водители не найдены</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">Ни один водитель не соответствует условиям вашего поиска.</p>
            </div>
          )}
        </div>
      ) : (
        /* Full Ledger Tab */
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-slate-500" />
              Общий реестр зарплат
            </CardTitle>
            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {filteredAllExpenses.length} записей
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <SortableTableHead sortKey="recordedAt" currentSortKey={sortKey as string} currentSortDirection={sortDirection} onSort={toggleSort} className="w-[120px]">Дата</SortableTableHead>
                  <SortableTableHead sortKey="driverId" currentSortKey={sortKey as string} currentSortDirection={sortDirection} onSort={toggleSort} className="w-[160px]">Водитель</SortableTableHead>
                  <SortableTableHead sortKey="note" currentSortKey={sortKey as string} currentSortDirection={sortDirection} onSort={toggleSort}>Описание / Заметка</SortableTableHead>
                  <SortableTableHead sortKey="amountRub" currentSortKey={sortKey as string} currentSortDirection={sortDirection} onSort={toggleSort} className="text-right w-[150px]">Сумма</SortableTableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllExpenses.map((expense) => {
                  const driver = drivers.find(d => d.id === expense.driverId);
                  return (
                    <TableRow key={expense.id} className="hover:bg-slate-50/30">
                      <TableCell className="text-xs text-slate-500 font-medium">
                        {format(new Date(expense.recordedAt), 'dd.MM.yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {driver ? (
                          <div>
                            <span className="font-bold text-xs text-slate-700 block">{driver.name}</span>
                            <span className="text-[9px] text-slate-400 font-extrabold tracking-wider">{driver.vehiclePlate}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">Общий расход</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-600">
                        {expense.note || '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm text-blue-600 font-extrabold">
                        -{expense.amountRub.toLocaleString()} RUB
                      </TableCell>
                      <TableCell className="text-right">
                        <ExpenseForm dict={dict} expense={expense} drivers={drivers} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredAllExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                      Записи о зарплатах не найдены.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
