"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { AppNotification, ConnectionStatus as StatusType, NotificationType } from "@/lib/types";
import ConnectionStatus from "@/components/ConnectionStatus";
import NotificationItem from "@/components/NotificationItem";
import { Bell, Send, CheckCheck, Trash2 } from "lucide-react";

export default function Home() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [status, setStatus] = useState<StatusType>("reconnecting");
  const [isOpen, setIsOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Form payload state
  const [title, setTitle] = useState("System Update");
  const [message, setMessage] = useState("Deployment completed successfully across all edge nodes.");
  const [selectedType, setSelectedType] = useState<NotificationType>("success");
  const [channels, setChannels] = useState<string[]>(["in-app", "email"]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxAttempts = 5;

  // 1. Initial State Fetching (Persistence layer)
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error("Failed to fetch initial notifications history", err);
      }
    }
    loadHistory();
  }, []);

  // 2. Client-Side WebSocket Integration featuring Exponential Backoff
  const connectWebSocket = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/api/ws";
    
    setStatus("reconnecting");
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setStatus("connected");
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const newNotification: AppNotification = JSON.parse(event.data);
        setNotifications((prev) => [newNotification, ...prev]);
      } catch (err) {
        console.error("Payload parsing failure:", err);
      }
    };

    ws.onclose = () => {
      setStatus("offline");
      // Trigger Exponential Backoff retry routine
      if (reconnectAttempts.current < maxAttempts) {
        const timeout = Math.pow(2, reconnectAttempts.current) * 1000;
        reconnectAttempts.current += 1;
        setTimeout(() => connectWebSocket(), timeout);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  // 3. Dispatching Notification Engine
  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            message,
            type: selectedType,
            channels,
          }),
        });
      } catch (err) {
        console.error("Trigger delivery execution failure", err);
      }
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Superior Navigation Layer */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
              ⚡
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">StaffNotify</h1>
              <p className="text-[10px] text-slate-400 font-mono">Realtime Engine Core</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ConnectionStatus status={status} />
            
            <div className="relative">
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800/60 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white font-bold text-[10px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-12 gap-8">
        {/* Core Administrative Trigger Engine Console */}
        <section className="md:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-1">
              <Send className="w-4 h-4 text-blue-400" /> Event Distribution Gate
            </h2>
            <p className="text-xs text-slate-400 mb-6">Dispatch standardized payloads across message channels leveraging fan-out routing.</p>

            <form onSubmit={handleTrigger} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Notification Severity Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["info", "success", "warning", "alert"] as NotificationType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all ${
                        selectedType === t 
                          ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-sm shadow-blue-500/10" 
                          : "border-slate-800 bg-slate-950/50 text-slate-500 hover:border-slate-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Payload Header (Title)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Message Content</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Delivery Channel Pipeline</label>
                <div className="flex gap-4">
                  {[
                    { id: "in-app", label: "In-App Push (WS)" },
                    { id: "email", label: "Simulated Email" },
                    { id: "sms", label: "Simulated SMS" },
                  ].map((ch) => (
                    <label key={ch.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channels.includes(ch.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setChannels((prev) => [...prev, ch.id]);
                          } else {
                            setChannels((prev) => prev.filter((c) => c !== ch.id));
                          }
                        }}
                        className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 focus:ring-offset-0"
                      />
                      {ch.label}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm py-2.5 rounded-lg shadow-lg shadow-blue-500/10 transition-all disabled:opacity-50"
              >
                {isPending ? "Routing Payload..." : "Dispatch System Notification"}
              </button>
            </form>
          </div>
        </section>

        {/* Real-time Display Console */}
        <section className="md:col-span-5">
          <div className="border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm rounded-2xl p-5 flex flex-col h-[550px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-200">Live Ingestion Array</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                  {notifications.length} Total
                </span>
              </div>

              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <button 
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setNotifications([])}
                    title="Clear event logs"
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <Bell className="w-8 h-8 text-slate-700 mb-2 stroke-1" />
                  <p className="text-xs text-slate-500 font-medium">Pipeline is silent</p>
                  <p className="text-[11px] text-slate-600 mt-1 max-w-xs">Trigger notifications via the dispatch control panel to observe live transmission state mechanics.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotificationItem 
                    key={notif.id} 
                    notification={notif} 
                    onMarkRead={markAsRead} 
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}