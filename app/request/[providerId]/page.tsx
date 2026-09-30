import type { Metadata } from "next";
import { capacities, getCapacity } from "@/data/capacities";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CatalogRequestForm } from "@/components/requests/catalog-request-form";

type Props = { params: Promise<{ providerId: string }> };
export function generateStaticParams() { return capacities.map(({ id }) => ({ providerId: id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const provider = getCapacity((await params).providerId);
  return { title: provider ? `Request ${provider.name} Capacity — CAPACITY` : "Request Capacity — CAPACITY" };
}
export default async function RequestPage({ params }: Props) {
  const { providerId } = await params;
  return <><Header /><CatalogRequestForm providerId={providerId} /><Footer /></>;
}
