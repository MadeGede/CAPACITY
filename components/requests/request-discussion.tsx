"use client";

import { useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import type { CapacityRequest } from "@/types/requests";
import { useRequestState } from "@/lib/data/requests";
import { useDataMode } from "@/lib/data/mode";
import { requestDate } from "@/lib/request-format";
import { showToast } from "@/lib/toast";

export function RequestDiscussion({ request, readOnly = false, providerName = "Provider" }: { request: CapacityRequest; readOnly?: boolean; providerName?: string }) {
  const { perspective, sendMessage } = useRequestState();
  const { mode } = useDataMode();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const closed = readOnly || ["rejected", "completed", "cancelled"].includes(request.status);
  return (
    <section aria-labelledby="discussion-title" className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-5 sm:px-6"><h2 id="discussion-title" className="flex items-center gap-2 text-base font-bold tracking-tight text-ink"><MessageSquare className="h-4 w-4 text-slate-400" aria-hidden="true" />Discussion</h2><span className="text-[10px] text-slate-400">{mode === "real" ? "Shared with both businesses" : "Local demo messages"}</span></div>
      <div className="max-h-[500px] overflow-y-auto p-5 sm:p-6" aria-live="polite" aria-relevant="additions">
        {request.messages.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Use this discussion to clarify specifications, timelines, and commercial terms.</p> : (
          <ol className="space-y-6">{request.messages.map((message) => <li key={message.id} className={`border-l-2 pl-4 ${message.author === "provider" ? "border-blue-200" : "border-slate-200"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-ink">{message.author === "buyer" ? request.buyerName : providerName}<span className="ml-2 text-[10px] font-normal capitalize text-slate-400">{message.author}</span></span><time dateTime={message.createdAt} className="text-[10px] text-slate-400">{requestDate(message.createdAt, true)}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{message.body}</p></li>)}</ol>
        )}
      </div>
      {closed ? <p className="border-t border-line px-5 py-4 text-xs text-slate-400">{readOnly ? "Only participating businesses can reply." : "This request is closed. The discussion remains available for reference."}</p> : <form className="border-t border-line bg-slate-50/50 p-5 sm:p-6" onSubmit={async (event) => { event.preventDefault(); if (sendingRef.current || !body.trim()) return; sendingRef.current = true; setSending(true); try { const operation = sendMessage(request.id, body); if (operation instanceof Promise) await operation; setBody(""); setError(""); showToast("Message sent"); } catch (error) { setError(error instanceof Error ? error.message : "Unable to add your message."); } finally { sendingRef.current = false; setSending(false); } }}>
        <label htmlFor="request-message" className="mb-2 block text-xs font-semibold text-slate-600">Message as {perspective === "buyer" ? "Buyer" : "Provider"}</label>
        <textarea id="request-message" maxLength={10000} value={body} onChange={(event) => setBody(event.target.value)} rows={3} placeholder="Discuss specifications, availability, or the proposed terms…" className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-blue-100" />
        <div className="mt-3 flex items-center justify-between gap-3"><p className="text-[10px] leading-5 text-slate-400">{mode === "real" ? "Visible to this request's buyer and provider." : "Visible in this demo workspace only."}</p><button type="submit" disabled={!body.trim() || sending} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink px-4 text-xs font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-3.5 w-3.5" aria-hidden="true" />{sending ? "Sending…" : "Send"}</button></div>
        {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
      </form>}
    </section>
  );
}
