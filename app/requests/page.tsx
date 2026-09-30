import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { RequestsList } from "@/components/requests/requests-list";

export const metadata: Metadata = {
  title: "Capacity Requests — CAPACITY",
  description: "Track production requests, review proposals, and manage business collaborations in CAPACITY.",
};

export default function RequestsPage() {
  return (
    <>
      <Header />
      <main id="top" className="min-h-[70vh] bg-paper pt-[72px]">
        <RequestsList />
      </main>
      <Footer />
    </>
  );
}
