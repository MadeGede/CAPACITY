"use client";

export const toastEventName = "capacity:toast";
export function showToast(message: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new window.CustomEvent<string>(toastEventName, { detail: message }));
}
