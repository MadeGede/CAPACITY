import type { Capacity } from "@/data/capacities";

const quantityFormatter = new Intl.NumberFormat("en-US");
const rupiahFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
export const formatNumber = (value: number) => quantityFormatter.format(value);
export const formatCurrencyInput = (value: number) => rupiahFormatter.format(value);
export const formatPrice = (value: number) => `Rp${formatCurrencyInput(value)}`;
export const formatCapacity = (capacity: Capacity) =>
  `${formatNumber(capacity.availableCapacity)} ${capacity.capacityUnit}${capacity.capacityPeriod}`;
export const formatMinimumOrder = (capacity: Capacity) =>
  `${formatNumber(capacity.minimumOrder)} ${capacity.minimumOrderUnit}`;
export const formatLeadTime = (days: number) => days === 0 ? "Immediate" : `${days} days`;
