export type NotificationType = "info" | "success" | "warning" | "alert";
export type ChannelType = "in-app" | "email" | "sms";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: ChannelType[];
  read: boolean;
  createdAt: string;
}

export type ConnectionStatus = "connected" | "reconnecting" | "offline";