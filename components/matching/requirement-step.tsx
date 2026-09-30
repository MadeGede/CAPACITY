"use client";

import type { ReactNode } from "react";
import { Check, Info } from "lucide-react";
import { categories, locations, type Category } from "@/data/capacities";
import { categoryOptions, certificationOptions, demandUnits, localDateString } from "@/lib/demand-options";
import { formatCurrencyInput } from "@/lib/capacity-format";
import type { DemandRequirement, DemandUnit } from "@/types/matching";

export const stepContent = [
  { title: "What do you need produced?", description: "Start with the production capability your business is looking for." },
  { title: "How much capacity do you need?", description: "Help us understand your production volume and order frequency." },
  { title: "Where should production happen?", description: "Choose a preferred area, or explore production partners across Indonesia." },
  { title: "When do you need it?", description: "Set a realistic deadline and the production lead time you prefer." },
  { title: "What's your expected budget?", description: "An estimate is enough to help us assess production cost compatibility." },
  { title: "Any special requirements?", description: "Add the materials and standards that matter to your production." },
  { title: "Review your requirement.", description: "Check the details below. You can edit any section before finding your matches." },
] as const;

const controlClass = "min-h-11 w-full rounded-md border bg-white px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-50 disabled:bg-paper disabled:text-slate-400";
const getControlClass = (error?: string) => `${controlClass} ${error ? "border-red-400" : "border-slate-200"}`;
const numberValue = (value: string) => value === "" ? null : Number(value);

function Field({ name, label, hint, error, children, optional = false }: { name: string; label: string; hint?: string; error?: string; children: ReactNode; optional?: boolean }) {
  return (
    <div>
      <label htmlFor={`demand-${name}`} className="mb-2 block text-xs font-semibold text-slate-700">{label}{optional && <span className="ml-1.5 font-normal text-slate-400">Optional</span>}</label>
      {children}
      {hint && <p id={`demand-${name}-hint`} className="mt-2 text-[11px] leading-5 text-slate-500">{hint}</p>}
      {error && <p id={`demand-${name}-error`} className="mt-2 text-xs leading-5 text-red-700">{error}</p>}
    </div>
  );
}

function SelectionGroup({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-semibold text-slate-700">{title}<span className="ml-1.5 font-normal text-slate-400">Optional</span></legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="relative cursor-pointer">
            <input type="checkbox" className="peer sr-only" checked={selected.includes(option)} onChange={() => onToggle(option)} />
            <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2">
              <span className={`grid h-3.5 w-3.5 place-items-center rounded-sm border ${selected.includes(option) ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300"}`} aria-hidden="true">{selected.includes(option) && <Check size={10} />}</span>
              {option}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function RequirementStep({ step, demand, errors, onChange }: { step: number; demand: DemandRequirement; errors: Record<string, string>; onChange: (changes: Partial<DemandRequirement>) => void }) {
  const props = (key: keyof DemandRequirement, hint = false) => ({
    id: `demand-${key}`,
    name: key,
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": [hint ? `demand-${key}-hint` : "", errors[key] ? `demand-${key}-error` : ""].filter(Boolean).join(" ") || undefined,
    className: getControlClass(errors[key]),
  });
  const toggle = (key: "materials" | "certifications", value: string) => onChange({ [key]: demand[key].includes(value) ? demand[key].filter((item) => item !== value) : [...demand[key], value] });

  if (step === 0) return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="category" label="Category" error={errors.category}>
          <select {...props("category")} value={demand.category} onChange={(event) => {
            const category = event.target.value as Category | "";
            onChange({ category, capability: "", materials: [], unit: category ? categoryOptions[category].defaultUnit : "units" });
          }}>
            <option value="">Select a category</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </Field>
        <Field name="capability" label="Capability" error={errors.capability}>
          <select {...props("capability")} value={demand.capability} disabled={!demand.category} onChange={(event) => onChange({ capability: event.target.value })}>
            <option value="">{demand.category ? "Select a capability" : "Choose a category first"}</option>
            {demand.category && categoryOptions[demand.category].capabilities.map((capability) => <option key={capability}>{capability}</option>)}
          </select>
        </Field>
      </div>
      <Field name="description" label="Describe Your Requirement" error={errors.description} hint="Include the product or component, its purpose, and any key specifications. At least 15 characters.">
        <textarea {...props("description", true)} rows={5} maxLength={5000} value={demand.description} onChange={(event) => onChange({ description: event.target.value })} placeholder="Describe the product, component, or production capability your business requires..." />
      </Field>
      <div className="flex gap-2.5 rounded-md bg-paper px-4 py-3.5 text-xs leading-6 text-slate-500"><Info size={15} className="mt-1 shrink-0 text-slate-400" aria-hidden="true" />Clear specifications help you compare partners and identify a suitable production capability.</div>
    </div>
  );

  if (step === 1) return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-[1.2fr_1fr]">
        <Field name="quantity" label={demand.demandType === "recurring" ? "First Production Quantity" : "Quantity"} error={errors.quantity}>
          <input {...props("quantity")} type="number" min="0" step={["kg", "tons", "production hours"].includes(demand.unit) ? "any" : "1"} inputMode="decimal" placeholder="e.g. 5000" value={demand.quantity ?? ""} onChange={(event) => onChange({ quantity: numberValue(event.target.value) })} />
        </Field>
        <Field name="unit" label="Unit" error={errors.unit}>
          <select {...props("unit")} value={demand.unit} onChange={(event) => onChange({ unit: event.target.value as DemandUnit })}>{demandUnits.map((unit) => <option key={unit}>{unit}</option>)}</select>
        </Field>
      </div>
      <fieldset>
        <legend className="mb-3 text-xs font-semibold text-slate-700">Demand Type</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[{ value: "one-time", label: "One-Time Production", hint: "A single order or project." }, { value: "recurring", label: "Recurring Production", hint: "Ongoing monthly production." }].map((option) => (
            <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors ${demand.demandType === option.value ? "border-brand-500 bg-brand-50/50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <input className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500" name="demandType" type="radio" checked={demand.demandType === option.value} onChange={() => onChange({ demandType: option.value as DemandRequirement["demandType"] })} />
              <span><span className="block text-xs font-semibold text-slate-700">{option.label}</span><span className="mt-1.5 block text-[11px] leading-5 text-slate-500">{option.hint}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      {demand.demandType === "recurring" && <div className="grid gap-5 rounded-md border border-line bg-paper/50 p-4 sm:grid-cols-2 sm:p-5">
        <Field name="monthlyQuantity" label={`Monthly Required Capacity (${demand.unit})`} error={errors.monthlyQuantity}>
          <input {...props("monthlyQuantity")} type="number" min="0" step={["kg", "tons", "production hours"].includes(demand.unit) ? "any" : "1"} inputMode="decimal" placeholder="e.g. 5000" value={demand.monthlyQuantity ?? ""} onChange={(event) => onChange({ monthlyQuantity: numberValue(event.target.value) })} />
        </Field>
        <Field name="durationMonths" label="Expected Duration" error={errors.durationMonths} hint="In months, from 1 to 60.">
          <input {...props("durationMonths", true)} type="number" min="1" max="60" step="1" inputMode="numeric" placeholder="e.g. 6" value={demand.durationMonths ?? ""} onChange={(event) => onChange({ durationMonths: numberValue(event.target.value) })} />
        </Field>
      </div>}
      <p className="text-xs leading-6 text-slate-500">{demand.demandType === "recurring" ? "We'll compare both your initial order and monthly volume with the provider's available capacity. Availability over the full contract must be confirmed." : "We'll compare your quantity with available capacity and the provider's minimum order."}</p>
    </div>
  );

  if (step === 2) return (
    <div className="space-y-6">
      <Field name="location" label="Preferred Location" error={errors.location}>
        <select {...props("location")} value={demand.location} onChange={(event) => onChange({ location: event.target.value as DemandRequirement["location"], ...(event.target.value === "any" ? { maxDistanceKm: null } : {}) })}>
          <option value="any">Any Location</option>
          {locations.map((location) => <option key={location}>{location}</option>)}
        </select>
      </Field>
      <Field name="maxDistanceKm" label="Maximum Preferred Distance" error={errors.maxDistanceKm} hint="A planning preference only. Location fit uses general city regions, not measured travel distances.">
        <select {...props("maxDistanceKm", true)} disabled={demand.location === "any"} value={demand.maxDistanceKm ?? ""} onChange={(event) => onChange({ maxDistanceKm: numberValue(event.target.value) })}>
          <option value="">No Preference</option>{[25, 50, 100, 250].map((distance) => <option key={distance} value={distance}>{distance} km</option>)}
        </select>
      </Field>
      <div className="rounded-md border border-line bg-paper/50 p-4"><p className="text-xs font-semibold text-slate-700">Keep your options open</p><p className="mt-2 text-xs leading-6 text-slate-500">With Any Location, all providers receive the same location score. Capability and production requirements still determine the overall fit.</p></div>
    </div>
  );

  if (step === 3) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="completionDate" label="Required Completion Date" error={errors.completionDate}>
            <input {...props("completionDate")} type="date" min={localDateString(tomorrow)} value={demand.completionDate} onChange={(event) => onChange({ completionDate: event.target.value })} />
          </Field>
          <Field name="maxLeadTimeDays" label="Preferred Maximum Lead Time" error={errors.maxLeadTimeDays}>
            <select {...props("maxLeadTimeDays")} value={demand.maxLeadTimeDays ?? ""} onChange={(event) => onChange({ maxLeadTimeDays: numberValue(event.target.value) })}>
              <option value="">Flexible</option>{[7, 14, 21, 30].map((days) => <option key={days} value={days}>{days} days</option>)}
            </select>
          </Field>
        </div>
        <fieldset>
          <legend className="mb-3 text-xs font-semibold text-slate-700">Urgency</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {[{ value: "standard", label: "Standard", hint: "Planned production" }, { value: "priority", label: "Priority", hint: "Time-sensitive work" }, { value: "urgent", label: "Urgent", hint: "Earliest possible start" }].map((option) => (
              <label key={option.value} className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-3.5 ${demand.urgency === option.value ? "border-brand-500 bg-brand-50/50" : "border-slate-200"}`}>
                <input type="radio" className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-brand-500" name="urgency" checked={demand.urgency === option.value} onChange={() => onChange({ urgency: option.value as DemandRequirement["urgency"] })} />
                <span><span className="block text-xs font-semibold">{option.label}</span><span className="mt-1.5 block text-[10px] leading-5 text-slate-500">{option.hint}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-xs leading-6 text-slate-500">We&apos;ll consider when a provider can start as well as their production lead time. Your completion date is the main deadline.</p>
      </div>
    );
  }

  if (step === 4) return (
    <div className="space-y-6">
      <div className="rounded-md border border-line bg-paper/60 px-4 py-3 text-xs text-slate-600">Enter the <span className="font-semibold">total {demand.demandType === "recurring" ? "monthly production budget" : "budget for this order"}</span>, in Indonesian Rupiah.</div>
      <div className="grid gap-5 sm:grid-cols-2">
        {([{ name: "budgetMin", label: "Minimum Budget", placeholder: "10.000.000" }, { name: "budgetMax", label: "Maximum Budget", placeholder: "30.000.000" }] as const).map((field) => (
          <Field key={field.name} name={field.name} label={field.label} error={errors[field.name]} optional={field.name === "budgetMin"}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-3 text-sm font-medium text-slate-400" aria-hidden="true">Rp</span>
              <input {...props(field.name)} className={`${getControlClass(errors[field.name])} pl-11`} type="text" inputMode="numeric" maxLength={22} placeholder={field.placeholder} disabled={demand.budgetFlexible} value={demand[field.name] === null ? "" : formatCurrencyInput(demand[field.name] ?? 0)} onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "");
                onChange({ [field.name]: digits ? Number(digits) : null });
              }} />
            </div>
          </Field>
        ))}
      </div>
      <label className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 ${demand.budgetFlexible ? "border-brand-500 bg-brand-50/50" : "border-slate-200"}`}>
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500" checked={demand.budgetFlexible} onChange={(event) => onChange({ budgetFlexible: event.target.checked })} />
        <span><span className="block text-xs font-semibold text-slate-700">Budget Flexible</span><span className="mt-1.5 block text-[11px] leading-5 text-slate-500">I&apos;m open to estimates based on production requirements.</span></span>
      </label>
      <p className="text-xs leading-6 text-slate-500">Budget information helps CAPACITY prioritize providers whose estimated production cost is closer to your target.</p>
    </div>
  );

  if (step === 5) return (
    <div className="space-y-7">
      <SelectionGroup title="Materials" options={demand.category ? categoryOptions[demand.category].materials : []} selected={demand.materials} onToggle={(value) => toggle("materials", value)} />
      <div><SelectionGroup title="Certifications" options={certificationOptions} selected={demand.certifications} onToggle={(value) => toggle("certifications", value)} /><p className="mt-3 text-[11px] leading-5 text-slate-500">We&apos;ll flag whether each requirement appears in the sample provider profile. Credentials must be confirmed with the provider.</p></div>
      <Field name="qualityRequirements" label="Quality Requirements" optional>
        <textarea {...props("qualityRequirements")} rows={3} maxLength={5000} value={demand.qualityRequirements} placeholder="e.g. Dimensional tolerance of ±0.05 mm and first-article inspection." onChange={(event) => onChange({ qualityRequirements: event.target.value })} />
      </Field>
      <Field name="technicalNotes" label="Technical Notes" optional>
        <textarea {...props("technicalNotes")} rows={3} maxLength={5000} value={demand.technicalNotes} placeholder="Add finishing, packaging, handling, or other technical considerations." onChange={(event) => onChange({ technicalNotes: event.target.value })} />
      </Field>
      <p className="text-[11px] leading-5 text-slate-500">Written specifications are carried into your summary for provider review. The compatibility score uses structured production criteria.</p>
    </div>
  );

  return null;
}
