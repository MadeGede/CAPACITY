import type { CSSProperties } from "react";
import type { MatchClassification } from "@/types/matching";

export function MatchScore({ score, classification }: { score: number; classification: MatchClassification }) {
  return (
    <div className={`min-w-[112px] shrink-0 rounded-xl border px-3 py-3 text-center ${score >= 75 ? "border-blue-200 bg-blue-50/50" : "border-slate-200 bg-slate-50"}`} aria-label={`${score}% compatibility, ${classification}`}>
      <div className={`score-ring mx-auto grid h-[74px] w-[74px] place-items-center rounded-full ${score < 75 ? "grayscale" : ""}`} style={{ "--score": `${Math.max(0, Math.min(score, 100))}%` } as CSSProperties}>
        <div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(191,219,254,.55)]">
          <span className={`text-[24px] font-bold leading-none tracking-[-0.06em] tabular-nums ${score >= 75 ? "text-brand-600" : "text-slate-600"}`}>{score}<span className="text-sm">%</span></span>
        </div>
      </div>
      <p className="mt-2 text-[9px] font-bold uppercase tracking-[.08em] text-slate-600">{classification}</p>
    </div>
  );
}
