import React from "react";
import { ConnectionStatus as StatusType } from "@/lib/types";

export default function ConnectionStatus({ status }: { status: StatusType }) {
  const config = {
    connected: { color: "bg-emerald-500", text: "Live", border: "border-emerald-500/20" },
    reconnecting: { color: "bg-amber-500 animate-pulse", text: "Reconnecting...", border: "border-amber-500/20" },
    offline: { color: "bg-rose-500", text: "Disconnected", border: "border-rose-500/20" },
  };

  const current = config[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-slate-900/50 backdrop-blur-sm ${current.border}`}>
      <span className={`relative flex h-2 w-2`}>
        {status === "connected" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.color}`}></span>
      </span>
      <span className="text-xs font-medium text-slate-300">{current.text}</span>
    </div>
  );
}