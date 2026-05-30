"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { bulkReassignOperator, reassignOrder } from "@/app/actions/management";
import { format } from "date-fns";

export function BulkReassignForm({ users, dict }: { users: any[], dict: any }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fromId = parseInt(formData.get("fromOperatorId") as string);
    const toId = parseInt(formData.get("toOperatorId") as string);

    if (fromId === toId) {
      toast.error("Bir xil operatorni tanlash mumkin emas!");
      setLoading(false);
      return;
    }

    try {
      await bulkReassignOperator(fromId, toId);
      toast.success("Barcha ma'lumotlar muvaffaqiyatli ko'chirildi!");
    } catch (error: any) {
      toast.error(error.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Qaysi operatordan ko'chiriladi? (Kimdan)</label>
        <select name="fromOperatorId" className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" required>
          <option value="">-- Tanlang --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} (@{u.username} - {u.role})</option>
          ))}
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Qaysi operatorga biriktiriladi? (Kimga)</label>
        <select name="toOperatorId" className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" required>
          <option value="">-- Tanlang --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} (@{u.username} - {u.role})</option>
          ))}
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Ko'chirilmoqda..." : "Barchasini ko'chirish"}
      </Button>
    </form>
  );
}

export function SingleOrderReassignForm({ users, allOrders, dict }: { users: any[], allOrders: any[], dict: any }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const orderId = parseInt(formData.get("orderId") as string);
    const toId = parseInt(formData.get("toOperatorId") as string);

    try {
      await reassignOrder(orderId, toId);
      toast.success("Buyurtma muvaffaqiyatli biriktirildi!");
    } catch (error: any) {
      toast.error(error.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Qaysi buyurtmani ko'chirasiz?</label>
        <select name="orderId" className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" required>
          <option value="">-- Tanlang --</option>
          {allOrders.map(o => (
            <option key={o.id} value={o.id}>
              ID: #{o.id} - {o.address} ({format(new Date(o.createdAt), 'dd.MM.yyyy')})
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Qaysi operatorga biriktiriladi?</label>
        <select name="toOperatorId" className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" required>
          <option value="">-- Tanlang --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} (@{u.username} - {u.role})</option>
          ))}
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Biriktirilmoqda..." : "Buyurtmani biriktirish"}
      </Button>
    </form>
  );
}
