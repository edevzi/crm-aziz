"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createOperator, updateOperator } from "@/app/actions/operator";
import { toast } from "sonner";
import { UserPlus, Pencil } from "lucide-react";

export function OperatorForm({ dict, operator }: { dict: any, operator?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    };

    try {
      if (operator) {
        await updateOperator(operator.id, data);
        toast.success(dict.operator_updated || "Оператор успешно обновлен");
      } else {
        await createOperator(data);
        toast.success(dict.operator_created || "Оператор успешно создан");
      }
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Ошибка при сохранении оператора");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {operator ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-primary text-primary-foreground shadow hover:bg-primary/90">
            <UserPlus className="mr-2 h-4 w-4" />
            {dict.add_operator || "Добавить оператора"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:!max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {operator ? (dict.edit_operator || "Редактировать оператора") : (dict.add_operator || "Добавить оператора")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{dict.name || "Имя"}</label>
            <Input name="name" defaultValue={operator?.name} required placeholder="Ism Familiya" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{dict.phone || "Телефон"}</label>
            <Input name="phone" defaultValue={operator?.phone} required placeholder="+998901234567" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{dict.username || "Логин"}</label>
            <Input name="username" defaultValue={operator?.username} required placeholder="operator1" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {dict.password || "Пароль"} {operator && "(Kiritilmasa, o'zgarmaydi)"}
            </label>
            <Input name="password" type="text" required={!operator} placeholder="Parol" />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? (dict.saving || "Сохранение...") : (dict.save || "Сохранить")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
