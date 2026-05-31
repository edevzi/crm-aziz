import React from 'react';
import { getOperators } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { Users } from 'lucide-react';
import { OperatorForm } from '@/components/forms/OperatorForm';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function OperatorsPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') {
    redirect('/dashboard');
  }

  const lang: string = 'ru';
  const dict = getDictionary(lang);

  const operators = await getOperators();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{(dict as any).operators || "Operatorlar"}</h1>
            <p className="text-slate-500 mt-1 font-medium">Tizimdagi barcha operatorlar</p>
          </div>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
          <OperatorForm dict={dict} />
        </div>
      </div>

      <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead>Ism Familiya</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Qo'shilgan sana</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators.map((operator) => (
                <TableRow key={operator.id}>
                  <TableCell className="font-semibold text-slate-800">{operator.name}</TableCell>
                  <TableCell className="font-medium text-slate-600">{operator.username}</TableCell>
                  <TableCell>{operator.phone || '-'}</TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {format(new Date(operator.createdAt), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <OperatorForm dict={dict} operator={operator} />
                  </TableCell>
                </TableRow>
              ))}
              {operators.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                    Operatorlar topilmadi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
