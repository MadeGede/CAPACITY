"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Loader2, SlidersHorizontal } from "lucide-react";
import { useDemandState } from "@/lib/data/demands";
import { validateDemand, validateDemandStep } from "@/lib/demand-options";
import { rankProviders } from "@/lib/matching";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { useDataMode } from "@/lib/data/mode";
import { useRealWorkspace } from "@/lib/data/real-workspace";
import { showToast } from "@/lib/toast";
import type { DemandRequirement } from "@/types/matching";
import { MatchProgress, matchSteps } from "./match-progress";
import { RequirementStep, stepContent } from "./requirement-step";
import { RequirementSummary } from "./requirement-summary";

export function MatchForm() {
  const { mode } = useDataMode();
  const real = useRealWorkspace();
  const router = useRouter();
  const { ready, draft, saveDraft, submitDemand } = useDemandState();
  const { providers } = useCapacityCatalog();
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [editingReview, setEditingReview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [savingDemand, setSavingDemand] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const initialized = useRef(false);
  const submittingRef = useRef(false);
  const interacted = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;
    const firstIncomplete = Array.from({ length: 6 }, (_, index) => index).find((index) => Object.keys(validateDemandStep(draft, index)).length > 0) ?? 6;
    setStep(firstIncomplete);
    setFurthestStep(firstIncomplete);
  }, [ready, draft]);

  useEffect(() => {
    if (!interacted.current) return;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [step]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); if (stageTimerRef.current) clearInterval(stageTimerRef.current); }, []);

  const change = (changes: Partial<DemandRequirement>) => {
    saveDraft({ ...draft, ...changes });
    if (Object.keys(errors).length) {
      setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !(key in changes) && !("category" in changes && key === "capability") && !(changes.budgetFlexible && ["budgetMin", "budgetMax"].includes(key)))));
    }
  };

  const goTo = (nextStep: number) => {
    interacted.current = true;
    setErrors({});
    setSubmitError("");
    setStep(nextStep);
    setFurthestStep((previous) => Math.max(previous, nextStep));
  };

  const focusError = () => {
    window.requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]')?.focus();
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (analyzing || submittingRef.current) return;
    const nextErrors = step === 6 ? validateDemand(draft) : validateDemandStep(draft, step);
    if (Object.keys(nextErrors).length) {
      if (step === 6) {
        const invalidStep = Array.from({ length: 6 }, (_, index) => index).find((index) => Object.keys(validateDemandStep(draft, index)).length > 0) ?? 0;
        goTo(invalidStep);
        setEditingReview(true);
      }
      setErrors(nextErrors);
      focusError();
      return;
    }
    if (step < 6) {
      goTo(editingReview ? 6 : step + 1);
      setEditingReview(false);
      return;
    }
    submittingRef.current = true;
    setSavingDemand(true);
    try {
      const submission = submitDemand(draft);
      if (submission instanceof Promise) await submission;
      rankProviders(draft, providers);
      showToast("Demand created; matching capacity");
      setAnalyzing(true);
      setAnalysisStage(0);
      stageTimerRef.current = setInterval(() => setAnalysisStage((stage) => Math.min(stage + 1, 4)), 150);
      timerRef.current = setTimeout(() => router.push("/match/results"), 750);
    } catch {
      setSubmitError("We couldn't submit your requirement. Your draft remains here; please try again.");
    } finally { submittingRef.current = false; setSavingDemand(false); }
  };

  if (!ready) return <div className="mx-auto min-h-[560px] max-w-7xl px-5 py-12 text-sm text-slate-500 sm:px-8 lg:px-10" role="status">Loading your production requirement…</div>;
  if (mode === "real" && real.error) return <section role="alert" className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="text-2xl font-semibold">Unable to load your production requirements.</h1><p className="mt-3 text-sm text-slate-500">Please check your connection and try again.</p><button type="button" onClick={() => void real.refresh()} className="mt-6 min-h-10 rounded-md bg-ink px-5 text-xs font-semibold text-white">Try Again</button></section>;

  return (
    <div className="mx-auto grid max-w-7xl items-start gap-6 px-5 py-7 sm:px-8 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:px-10">
      <aside className="lg:sticky lg:top-28">
        <MatchProgress step={step} furthestStep={furthestStep} onStep={(nextStep) => { setEditingReview(false); goTo(nextStep); }} disabled={analyzing} />
        <div className="mt-8 hidden rounded-lg border border-line bg-white p-4 lg:block">
          <SlidersHorizontal size={16} className="mb-3 text-brand-500" aria-hidden="true" />
          <p className="text-xs font-semibold">A clear view of the fit.</p>
          <p className="mt-2 text-[11px] leading-6 text-slate-500">Your matches compare capability, capacity, location, availability, lead time, and cost. Every recommendation includes a score breakdown.</p>
        </div>
      </aside>

      <form ref={formRef} noValidate onSubmit={submit} className="min-w-0 overflow-hidden rounded-lg border border-line bg-white shadow-soft" aria-label="Production requirements" aria-busy={analyzing || savingDemand}>
        <div className="border-b border-line px-5 py-5 sm:px-8 sm:py-6">
          <div className="mb-4 flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-500">Step {String(step + 1).padStart(2, "0")} / {String(matchSteps.length).padStart(2, "0")}</p><span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400"><Check size={11} aria-hidden="true" />Draft kept as you go</span></div>
          <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-28 text-2xl font-semibold leading-tight tracking-tight text-ink outline-none sm:text-[28px]">{stepContent[step].title}</h2>
          <p className="mt-3 text-xs leading-6 text-slate-500 sm:text-sm">{stepContent[step].description}</p>
        </div>

        {analyzing ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-12 text-center" role="status" aria-live="polite">
            <span className="grid h-14 w-14 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-500"><Loader2 size={24} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /></span>
            <h3 className="mt-6 text-xl font-semibold tracking-tight">Analyzing production requirement</h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">{["Comparing available capacity", "Evaluating capability compatibility", "Checking location and lead time", "Reviewing estimated cost", "Ranking providers"][analysisStage]}</p>
          </div>
        ) : (
          <div className="min-h-[330px] px-5 py-6 sm:px-8 sm:py-8">
            {Object.keys(errors).length > 0 && <div role="alert" className="mb-6 flex gap-2.5 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700"><CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Please check the highlighted fields before continuing.</div>}
            {step === 6 ? <RequirementSummary demand={draft} onEdit={(index) => { setEditingReview(true); goTo(index); }} /> : <RequirementStep step={step} demand={draft} errors={errors} onChange={change} />}
            {submitError && <p role="alert" className="mt-5 text-sm text-red-700">{submitError}</p>}
          </div>
        )}

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-8 sm:py-5">
          {step > 0 ? <button type="button" onClick={() => { setEditingReview(false); goTo(step - 1); }} disabled={analyzing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50"><ArrowLeft size={14} aria-hidden="true" />Back</button> : <span className="text-[11px] text-slate-400">7 steps to a better fit</span>}
          <button type="submit" disabled={analyzing || savingDemand} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:px-5">
            {savingDemand ? "Saving demand…" : analyzing ? "Preparing matches…" : step === 6 ? "Find Matching Capacity" : editingReview ? "Save & Return to Review" : "Continue"}{!analyzing && !savingDemand && <ArrowRight size={14} aria-hidden="true" />}
          </button>
        </div>
      </form>
    </div>
  );
}
