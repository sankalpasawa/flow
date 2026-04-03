import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { BrideFashionContent } from "./content";

export const metadata: Metadata = {
  title: "Bride Fashion Trends 2026 — PPR",
  description:
    "Curated research: latest Indian bridal fashion trends, top designers, Instagram inspo, color palettes, and where to buy.",
  openGraph: {
    title: "Bride Fashion Trends 2026",
    description:
      "Lehengas, sarees, fusion — the complete bridal style guide for a 2026 Indian wedding.",
  },
};

export default function BrideFashionPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <BrideFashionContent />
      </main>
    </>
  );
}
