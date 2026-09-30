import type { Metadata } from "next";
import { CapacityEditor } from "@/components/dashboard/capacity-editor";

export const metadata: Metadata = { title: "Edit Capacity | CAPACITY" };

export default async function EditCapacityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CapacityEditor key={id} id={id} />;
}
