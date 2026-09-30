import type { Metadata } from "next";
import { CatalogProfile } from "@/components/capacity/catalog-profile";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { capacities, getCapacity } from "@/data/capacities";

type CapacityPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return capacities.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: CapacityPageProps): Promise<Metadata> {
  const { id } = await params;
  const capacity = getCapacity(id);
  if (!capacity) {
    return { title: "Capacity Profile | CAPACITY", description: "Explore this locally managed production capacity listing." };
  }

  return {
    title: `${capacity.name} · ${capacity.capability} | CAPACITY`,
    description: `${capacity.description} Explore available capacity, production facilities, and lead times in ${capacity.location}, Indonesia.`,
    openGraph: {
      title: `${capacity.name} · ${capacity.capability} | CAPACITY`,
      description: `${capacity.description} Explore available production capacity in ${capacity.location}, Indonesia.`,
      type: "website",
    },
  };
}

export default async function CapacityPage({ params }: CapacityPageProps) {
  const { id } = await params;
  return (
    <>
      <Header />
      <CatalogProfile id={id} />
      <Footer />
    </>
  );
}
