import React from "react";
import { AppNotification } from "@/lib/types";
import { Info, CheckCircle2, AlertTriangle, XCircle, Check } from "lucide-react";

interface Props {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
}

export default function NotificationItem({ notification, onMarkRead }: Props) {
  const getStyles = (type: AppNotification["type"]) => {
    switch (type) {
      case "success":
        return { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, border: "border-emerald-500/20", bg: "bg-emerald-500/5" };
      case "warning":
        return { icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, border: "border-amber-500/20", bg: "bg-amber-500/5" };
      case "alert":
        return { icon: <XCircle className="w-5 h-5 text-rose-500" />, border: "border-rose-500/20", bg: "bg-rose-500/5" };
      default:
        return { icon: <Info className="w-5 h-5 text-blue-500" />, border: "border-blue-500/20", bg: "bg-blue-500/5" };
    }
  };

  const { icon, border, bg } = getStyles(notification.type);

  return (
    <div className={`p-4 rounded-xl border transition-all ${border} ${notification.read ? "bg-slate-900/20 opacity-60" : `bg-slate-900/80 ${bg}`}`}>
      <div className="flex gap-3 items-start">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-200 truncate">{notification.title}</h4>
            <span className="text-[10px] text-slate-500 shrink-0">
              {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{notification.message}</p>
          
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
            <div className="flex gap-1.5">
              {notification.channel.map((ch) => (
                <span key={ch} className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                  {ch}
                </span>
              ))}
            </div>
            {!notification.read && (
              <button 
                onClick={() => onMarkRead(notification.id)}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                <Check className="w-3 h-3" /> Mark read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}