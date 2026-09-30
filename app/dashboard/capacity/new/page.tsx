import type { Metadata } from "next";
import { CapacityEditor } from "@/components/dashboard/capacity-editor";

export const metadata: Metadata = { title: "List Capacity | CAPACITY" };

export default function NewCapacityPage() {
  return <CapacityEditor />;
}
