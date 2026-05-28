"use client";

import { useState } from "react";
import { Send, BellRing, Users, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { sendCustomPushNotification } from "@/app/actions/notifications";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

export function NotificationForm({ drivers, lang }: { drivers: any[]; lang: string }) {
  const [target, setTarget] = useState<"all" | "specific">("all");
  const [driverId, setDriverId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const t = {
    title: 'Уведомления',
    subtitle: 'Отправка push-уведомлений водителям',
    targetLabel: 'Кому',
    targetAll: 'Всем водителям',
    targetSpecific: 'Конкретному водителю',
    selectDriver: 'Выберите водителя',
    msgTitle: 'Заголовок',
    msgBody: 'Текст сообщения',
    sendBtn: 'Отправить',
    sending: 'Отправка...',
    success: 'Сообщение успешно отправлено!',
    errorFill: 'Пожалуйста, заполните все поля',
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || (target === 'specific' && !driverId)) {
      setStatus({ type: 'error', message: t.errorFill });
      return;
    }

    setLoading(true);
    setStatus(null);

    const res = await sendCustomPushNotification({
      title: title.trim(),
      body: body.trim(),
      target,
      driverId: target === 'specific' ? Number(driverId) : undefined,
    });

    setLoading(false);

    if (res.success) {
      setStatus({ type: 'success', message: `${t.success} (${res.count} ta)` });
      setTitle("");
      setBody("");
    } else {
      setStatus({ type: 'error', message: res.error || "Xatolik" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
          <BellRing className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.title}</h1>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSend} className="p-6 space-y-6">
          
          {/* Target Selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">{t.targetLabel}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTarget("all")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  target === "all" 
                    ? "border-pink-500 bg-pink-50 text-pink-700 font-semibold shadow-sm" 
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Users className={`h-5 w-5 ${target === "all" ? "text-pink-600" : "text-slate-400"}`} />
                {t.targetAll}
              </button>
              <button
                type="button"
                onClick={() => setTarget("specific")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  target === "specific" 
                    ? "border-pink-500 bg-pink-50 text-pink-700 font-semibold shadow-sm" 
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <User className={`h-5 w-5 ${target === "specific" ? "text-pink-600" : "text-slate-400"}`} />
                {t.targetSpecific}
              </button>
            </div>
          </div>

          {/* Specific Driver Select */}
          {target === "specific" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-semibold text-slate-700">{t.selectDriver}</label>
              <SearchableSelect
                options={drivers.map(d => ({
                  value: String(d.id),
                  label: d.name,
                  sub: d.vehiclePlate || undefined
                }))}
                value={String(driverId)}
                onChange={(val) => setDriverId(val ? Number(val) : "")}
                placeholder={`-- ${t.selectDriver} --`}
              />
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">{t.msgTitle}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Новости"
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
            />
          </div>

          {/* Body Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">{t.msgBody}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Введите текст сообщения..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none resize-none"
            />
          </div>

          {/* Status Alert */}
          {status && (
            <div className={`p-4 rounded-xl flex gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl font-semibold shadow-lg shadow-pink-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  {t.sendBtn}
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
