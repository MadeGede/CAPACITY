"use client";

import { useDemandState as useDemoDemand } from "@/lib/demand-store";
import { useDataMode } from "./mode";
import { useRealWorkspace } from "./real-workspace";

export function useDemandState() {
  const demo = useDemoDemand();
  const real = useRealWorkspace();
  const { mode } = useDataMode();
  return mode === "demo" ? demo : { ready: real.ready, draft: real.draft, submittedDemand: real.submittedDemand, selectedRequest: real.selectedRequest,
    demands: real.demands, activeDemandId: real.activeDemandId, saveDraft: real.saveDraft, submitDemand: real.submitDemand, selectRequest: real.selectRequest,
    newDemand: real.newDemand, editDemand: real.editDemand, viewDemandMatches: real.viewDemandMatches, duplicateDemand: real.duplicateDemand,
    closeDemand: real.closeDemand, recordMatches: real.recordMatches };
}
