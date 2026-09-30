"use client";

import { useRequestState as useDemoRequest } from "@/lib/request-store";
import { useDataMode } from "./mode";
import { useRealWorkspace } from "./real-workspace";

export function useRequestState() {
  const demo = useDemoRequest();
  const real = useRealWorkspace();
  const { mode } = useDataMode();
  return mode === "demo" ? demo : { ready: real.ready, requests: real.requests, perspective: real.perspective, sessionOnly: false,
    setPerspective: real.setPerspective, create: real.create, actOnRequest: real.actOnRequest, sendMessage: real.sendMessage, saveProposal: real.saveProposal };
}
