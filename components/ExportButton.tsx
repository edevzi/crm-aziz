'use client';

import React from 'react';
import { Download, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export function ExportButton({
  data,
  columns,
  filename = 'report',
  title = 'Report',
  dict
}: {
  data: any[];
  columns: { key: string; label: string }[];
  filename?: string;
  title?: string;
  dict: any;
}) {
  const isUz = dict.logout === "Chiqish";
  const dateLabel = isUz ? "Sana" : "Дата";
  const footerLabel = isUz ? "CRM Waste Management - Avtomatlashtirilgan Hisobot" : "CRM Waste Management - Автоматический отчет";

  const handleExcelExport = () => {
    const headers = columns.map(col => col.label).join(';');
    const rows = data.map(item => 
      columns.map(col => {
        const val = item[col.key] ?? '';
        return `"${val.toString().replace(/"/g, '""')}"`;
      }).join(';')
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWordExport = () => {
    const tableHeaders = columns.map(col => `<th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: left; font-family: Arial, sans-serif;">${col.label}</th>`).join('');
    const tableRows = data.map(item => 
      `<tr>${columns.map(col => `<td style="border: 1px solid #cbd5e1; padding: 8px; font-family: Arial, sans-serif;">${item[col.key] ?? ''}</td>`).join('')}</tr>`
    ).join('');
    
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${title}</title><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #1e293b; text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; font-family: Arial, sans-serif;">${title}</h2>
        <p style="font-size: 11px; color: #64748b; text-align: right; font-family: Arial, sans-serif;">${dateLabel}: ${new Date().toLocaleDateString()}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead><tr>${tableHeaders}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.docx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePDFExport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableHeaders = columns.map(col => `<th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: left; font-size: 12px; font-family: Arial, sans-serif;">${col.label}</th>`).join('');
    const tableRows = data.map(item => 
      `<tr>${columns.map(col => `<td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; font-family: Arial, sans-serif;">${item[col.key] ?? ''}</td>`).join('')}</tr>`
    ).join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
          h1 { text-align: center; color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; font-size: 22px; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; }
          .footer { margin-top: 50px; text-align: right; font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p style="font-size: 12px; color: #64748b; text-align: right;">${dateLabel}: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead><tr>${tableHeaders}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="footer">${footerLabel}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" className="rounded-full px-5 py-2 font-semibold shadow-sm hover:bg-slate-50 gap-2 border-slate-200/80">
          <Download className="h-4 w-4 text-slate-500" />
          {dict.export || "Eksport"}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" className="w-48 p-2 rounded-2xl border border-slate-100 shadow-xl bg-white z-[999]">
          <DropdownMenu.Item onClick={handleExcelExport} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer outline-none">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            {isUz ? "Excel formatida" : "В формате Excel"}
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={handleWordExport} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer outline-none">
            <FileText className="h-4 w-4 text-blue-600" />
            {isUz ? "Word formatida" : "В формате Word"}
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={handlePDFExport} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer outline-none">
            <FileDown className="h-4 w-4 text-rose-600" />
            {isUz ? "PDF formatida (Chop etish)" : "В формате PDF (Печать)"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
