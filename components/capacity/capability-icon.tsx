import { Box, Boxes, Cog, Cpu, PackageCheck, Printer, Shirt, Utensils, Warehouse } from "lucide-react";
import type { Category } from "@/data/capacities";

const icons = {
  "CNC & Machining": Cog,
  "Plastic Manufacturing": Boxes,
  Packaging: PackageCheck,
  "Food Production": Utensils,
  Textile: Shirt,
  Printing: Printer,
  "3D Printing": Box,
  Assembly: Cpu,
  Warehousing: Warehouse,
};

export function CapabilityIcon({ category, className = "" }: { category: Category; className?: string }) {
  const Icon = icons[category];
  return <Icon aria-hidden="true" strokeWidth={1.6} className={`h-5 w-5 ${className}`} />;
}
