import type { Metadata } from "next";
import "./globals.css";
import { ToastHost } from "@/components/ui/toast-host";
import { cookies } from "next/headers";
import { DataModeProvider } from "@/lib/data/mode";
import { RealWorkspaceProvider } from "@/lib/data/real-workspace";
import { CompetitionDemoGuide } from "@/components/competition/demo-guide";
import { modeCookieName, type DataMode } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "CAPACITY — Connect Business Capacity and Demand",
  description:
    "CAPACITY connects businesses with unused production capacity to businesses that need additional production resources.",
  applicationName: "CAPACITY",
  openGraph: {
    type: "website",
    siteName: "CAPACITY",
    title: "CAPACITY — Connect Business Capacity and Demand",
    description: "Connect unused production capacity with businesses that need additional production resources.",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const mode = (await cookies()).get(modeCookieName)?.value === "real" ? "real" : "demo";
  return (
    <html lang="en">
      <body><DataModeProvider initialMode={mode as DataMode}><RealWorkspaceProvider>{children}<CompetitionDemoGuide /><ToastHost /></RealWorkspaceProvider></DataModeProvider></body>
    </html>
  );
}
