import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { GroomFashionContent } from "./content";

export const metadata: Metadata = {
  title: "Groom Fashion Trends 2026 — PPR",
  description:
    "Curated research: latest Indian groom fashion trends, top designers, Instagram inspo, color palettes, and where to buy.",
  openGraph: {
    title: "Groom Fashion Trends 2026",
    description:
      "Sherwanis, bandhgalas, Indo-western — the complete groom style guide for a 2026 Indian wedding.",
  },
};

export default function GroomFashionPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <GroomFashionContent />
      </main>
    </>
  );
}
