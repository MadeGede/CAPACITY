import type { Metadata } from "next";
import { CapacityManagement } from "@/components/dashboard/capacity-management";

export const metadata: Metadata = { title: "My Capacity | CAPACITY" };

export default function MyCapacityPage() {
  return <CapacityManagement />;
}
