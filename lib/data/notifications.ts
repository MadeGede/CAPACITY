"use client";
import { useReadNotifications as useDemoNotifications } from "@/lib/notification-store";
import { useDataMode } from "./mode";
import { useRealWorkspace } from "./real-workspace";
export function useReadNotifications() {
  const demo = useDemoNotifications(); const real = useRealWorkspace(); const { mode } = useDataMode();
  return mode === "demo" ? demo : { readIds: real.notifications.filter((item) => item.is_read).map((item) => item.id), markRead: real.markRead };
}
