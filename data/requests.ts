import { getCapacity } from "./capacities";
import { addRequestMessage, createRequest, setRequestProposal, transitionRequest } from "../lib/request-rules";
import type { CapacityRequest, RequestDraft } from "../types/requests";
import { DEMO_BUYER_NAME } from "../lib/demo-identity";

// Local demonstration records only. Relative dates keep the collaboration demo
// useful when opened later; persistent browser records retain their original dates.
const referenceDate = new Date();
const at = (days: number) => new Date(referenceDate.getTime() + days * 86_400_000);
const date = (days: number) => {
  const value = at(days);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

function draft(providerId: string, changes: Partial<RequestDraft>): RequestDraft {
  const provider = getCapacity(providerId);
  if (!provider) throw new Error(`Unknown demo provider: ${providerId}`);
  const quantity = Math.max(provider.minimumOrder, 100);
  return {
    providerId,
    buyerName: DEMO_BUYER_NAME,
    capability: provider.capability,
    category: provider.category,
    quantity,
    unit: provider.minimumOrderUnit,
    location: provider.location,
    preferredStartDate: date(5),
    requiredCompletionDate: date(5 + provider.leadTimeDays),
    preferredLeadTimeDays: provider.leadTimeDays,
    urgency: "standard",
    budget: quantity * provider.priceTo,
    budgetFlexibility: "slightly_flexible",
    materials: provider.materials.slice(0, 2),
    description: `A repeat production batch requiring ${provider.capability.toLowerCase()} with first-article approval before full production.`,
    technicalRequirements: "Please review the dimensions and production notes in the named specification.",
    qualityRequirements: "First-article approval and a final inspection summary.",
    certifications: provider.certifications.includes("Quality Control Process") ? ["Quality Control Process"] : [],
    additionalNotes: "Delivery arrangements will be discussed separately.",
    attachments: [],
    message: "Hello, please review our production requirement and confirm a suitable production slot.",
    demandType: "one-time",
    durationMonths: null,
    ...changes,
  };
}

function precisionNegotiation(): CapacityRequest {
  let request = createRequest(draft("precision-works", {
    capability: "CNC Milling", quantity: 5000, unit: "units", location: "Jakarta",
    budget: 110000000, preferredStartDate: date(0), requiredCompletionDate: date(15), preferredLeadTimeDays: 15,
    materials: ["Aluminum"], description: "5,000 CNC-machined aluminum mounting components for our industrial equipment production line.",
    technicalRequirements: "Aluminum 6061, dimensional tolerance ±0.05 mm, deburred edges. Review the drawing before the sample run.",
    attachments: [{ id: "precision-spec", name: "component-specification.pdf", type: "PDF" }, { id: "precision-drawing", name: "mounting-component.dwg", type: "CAD File" }],
    message: "Hello, we require 5,000 CNC-machined components and would like production completed within 21 days.",
  }), "REQ-2026-00124", at(-2));
  request = transitionRequest(request, "start_review", "provider", "", at(-1.9));
  request = addRequestMessage(request, "Thank you for the request. Our production schedule can support approximately 5,000 units within 14–16 days.", "provider", at(-1.8));
  request = transitionRequest(request, "start_negotiation", "provider", "", at(-1.7));
  request = addRequestMessage(request, "That timeline works. Is the estimated pricing still within your listed range?", "buyer", at(-1.5));
  request = addRequestMessage(request, "Yes. Based on the current specification, we estimate Rp21.500 per unit. Please review the production proposal below.", "provider", at(-0.8));
  return setRequestProposal(request, {
    quantity: 5000, unitPrice: 21500, startDate: date(0), completionDate: date(15), leadTimeDays: 15,
    notes: "Includes machining, deburring, and dimensional inspection. A first-article sample will be submitted before the full run.",
  }, "provider", at(-0.7));
}

function packagingAccepted(): CapacityRequest {
  let request = createRequest(draft("packpro-indonesia", {
    buyerName: DEMO_BUYER_NAME, capability: "Custom Packaging", quantity: 10000, unit: "packages", budget: 35000000,
    preferredStartDate: date(2), requiredCompletionDate: date(12), preferredLeadTimeDays: 10,
    materials: ["Kraft board"], description: "10,000 custom printed kraft folding cartons for a new household goods collection.",
    attachments: [{ id: "packaging-dieline", name: "product-carton-dieline.pdf", type: "Drawing" }],
  }), "REQ-2026-00118", at(-4));
  request = transitionRequest(request, "start_review", "provider", "", at(-3.8));
  request = transitionRequest(request, "start_negotiation", "provider", "", at(-3));
  request = setRequestProposal(request, {
    quantity: 10000, unitPrice: 3200, startDate: date(2), completionDate: date(12), leadTimeDays: 10,
    notes: "Approved kraft board sample and two-color print. Dieline preparation is included.",
  }, "provider", at(-2.5));
  request = addRequestMessage(request, "The sample and proposed schedule are approved. Please proceed with the agreed quantity.", "buyer", at(-1.3));
  return transitionRequest(request, "accept_proposal", "buyer", "", at(-1));
}

function prototypeCompleted(): CapacityRequest {
  let request = createRequest(draft("protolab", {
    buyerName: DEMO_BUYER_NAME, capability: "Industrial 3D Printing", quantity: 120, unit: "parts", budget: 12000000,
    preferredStartDate: date(-11), requiredCompletionDate: date(-6), preferredLeadTimeDays: 5,
    materials: ["PETG"], description: "120 functional prototype enclosures for a product fit-check and pilot assembly evaluation.",
    attachments: [{ id: "prototype-cad", name: "enclosure-revision-b.step", type: "CAD File" }],
  }), "REQ-2026-00105", at(-14));
  request = transitionRequest(request, "start_review", "provider", "", at(-13.8));
  request = transitionRequest(request, "start_negotiation", "provider", "", at(-13));
  request = setRequestProposal(request, {
    quantity: 120, unitPrice: 85000, startDate: date(-11), completionDate: date(-6), leadTimeDays: 5,
    notes: "PETG printing, support removal, and fit-check measurements included.",
  }, "provider", at(-12.5));
  request = transitionRequest(request, "accept_proposal", "buyer", "", at(-12));
  request = transitionRequest(request, "start_collaboration", "provider", "", at(-11));
  request = addRequestMessage(request, "The prototype batch passed our fit-check inspection and is ready for handover.", "provider", at(-6.2));
  return transitionRequest(request, "complete", "provider", "", at(-6));
}

function assemblyInProgress(): CapacityRequest {
  let request = createRequest(draft("rakit-manufaktur", {
    buyerName: DEMO_BUYER_NAME, capability: "Mechanical Assembly", quantity: 4000, unit: "units", budget: 70000000,
    preferredStartDate: date(-5), requiredCompletionDate: date(5), preferredLeadTimeDays: 10,
    materials: ["Machined components", "Standard fasteners"], description: "Assembly of 4,000 mechanical mounting kits from our supplied components and fastening instructions.",
  }), "REQ-2026-00112", at(-10));
  request = transitionRequest(request, "start_review", "provider", "", at(-9));
  request = transitionRequest(request, "start_negotiation", "provider", "", at(-8));
  request = setRequestProposal(request, {
    quantity: 4000, unitPrice: 15500, startDate: date(-5), completionDate: date(5), leadTimeDays: 10,
    notes: "Customer-supplied components, torque-controlled assembly, and functional checks.",
  }, "provider", at(-7));
  request = transitionRequest(request, "accept_proposal", "buyer", "", at(-6));
  request = transitionRequest(request, "start_collaboration", "provider", "", at(-5));
  return addRequestMessage(request, "The first assembly batch has completed its functional checks. Production is continuing to the agreed schedule.", "provider", at(-0.3));
}

function garmentReviewing(): CapacityRequest {
  const request = createRequest(draft("garmentworks-bandung", {
    buyerName: DEMO_BUYER_NAME, capability: "Uniform Production", quantity: 1200, unit: "pcs", budget: 78000000,
    preferredStartDate: date(10), requiredCompletionDate: date(28), preferredLeadTimeDays: 18,
    materials: ["Cotton", "Twill"], description: "1,200 staff uniforms across four approved sizes with embroidered company branding.",
  }), "REQ-2026-00128", at(-1.2));
  return transitionRequest(request, "start_review", "provider", "", at(-0.4));
}

function printingRejected(): CapacityRequest {
  const request = createRequest(draft("cetak-prima", {
    buyerName: DEMO_BUYER_NAME, capability: "Catalog Production", quantity: 3000, unit: "prints", budget: 10000000,
    preferredStartDate: date(1), requiredCompletionDate: date(8), preferredLeadTimeDays: 7,
    description: "3,000 product catalogs with a special binding process for our seasonal distributor program.",
  }), "REQ-2026-00109", at(-3));
  return transitionRequest(request, "reject_request", "provider", "Technical Requirement Unsupported: the requested specialty binding is not available on our current finishing line.", at(-2));
}

export const demoRequests: CapacityRequest[] = [
  createRequest(draft("nusantara-plastics", {
    buyerName: DEMO_BUYER_NAME, capability: "Injection Molding", quantity: 12000, unit: "units", budget: 90000000,
    preferredStartDate: date(7), requiredCompletionDate: date(28), preferredLeadTimeDays: 21,
    materials: ["Polypropylene"], description: "12,000 polypropylene protective housings using our approved production mold and color masterbatch.",
    attachments: [{ id: "plastic-spec", name: "housing-production-spec.pdf", type: "PDF" }],
  }), "REQ-2026-00131", at(-0.1)),
  precisionNegotiation(),
  garmentReviewing(),
  assemblyInProgress(),
  packagingAccepted(),
  printingRejected(),
  prototypeCompleted(),
];
