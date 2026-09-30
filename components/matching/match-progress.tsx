"use client";

import { Check } from "lucide-react";

export const matchSteps = [
  { name: "Production Need", detail: "Capability & specifications" },
  { name: "Capacity", detail: "Volume & production frequency" },
  { name: "Location", detail: "Your preferred production area" },
  { name: "Timeline", detail: "Deadline & lead time" },
  { name: "Budget", detail: "Your estimated investment" },
  { name: "Requirements", detail: "Materials & quality standards" },
  { name: "Review", detail: "Confirm your requirements" },
] as const;

export function MatchProgress({ step, furthestStep, onStep, disabled }: { step: number; furthestStep: number; onStep: (step: number) => void; disabled?: boolean }) {
  return (
    <nav aria-label="Production requirement progress">
      <div className="lg:hidden">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-ink">{matchSteps[step].name}</span>
          <span className="text-slate-500">Step {step + 1} of {matchSteps.length}</span>
        </div>
        <ol className="flex gap-1.5">
          {matchSteps.map((item, index) => (
            <li key={item.name} className="flex-1">
              <button type="button" onClick={() => onStep(index)} disabled={disabled || index > furthestStep} aria-label={`Step ${index + 1}: ${item.name}`} aria-current={step === index ? "step" : undefined} className="group block w-full rounded-sm py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-default">
                <span className={`block h-1 rounded-full ${index === step ? "bg-brand-500" : index < step ? "bg-brand-100" : "bg-slate-200"}`} />
              </button>
            </li>
          ))}
        </ol>
      </div>
      <ol className="hidden lg:block">
        {matchSteps.map((item, index) => (
          <li key={item.name} className="relative pb-5 last:pb-0">
            {index < matchSteps.length - 1 && <span aria-hidden="true" className={`absolute left-[15px] top-9 h-6 w-px ${index < step ? "bg-brand-100" : "bg-slate-200"}`} />}
            <button type="button" onClick={() => onStep(index)} disabled={disabled || index > furthestStep} aria-current={step === index ? "step" : undefined} className="group flex w-full items-start gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4 disabled:cursor-default">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold ${index === step ? "border-brand-500 bg-brand-500 text-white" : index < step ? "border-brand-100 bg-brand-50 text-brand-600" : "border-slate-200 bg-white text-slate-400"}`}>
                {index < step ? <Check size={14} aria-hidden="true" /> : index + 1}
              </span>
              <span className="pt-0.5">
                <span className={`block text-xs font-semibold ${index === step ? "text-brand-600" : index < step ? "text-ink" : "text-slate-500"}`}>{item.name}</span>
                <span className="mt-1 block text-[10px] leading-4 text-slate-400">{item.detail}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
