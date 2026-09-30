import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { MatchResults } from "@/components/matching/match-results";

export const metadata: Metadata = {
  title: "Your Capacity Matches — CAPACITY",
  description: "Review production partners ranked against your requirements, with transparent compatibility scores and match analysis.",
};

export default function MatchResultsPage() {
  return (
    <>
      <Header />
      <main id="top" className="min-h-[70vh] bg-paper pt-[72px]">
        <MatchResults />
      </main>
      <Footer />
    </>
  );
}
