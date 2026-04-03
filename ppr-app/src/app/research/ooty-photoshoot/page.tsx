import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { OotyResearchContent } from "./content";

export const metadata: Metadata = {
  title: "Pre-Wedding Photoshoot in Ooty — PPR",
  description:
    "Research: best locations, photographers, timing, and logistics for a pre-wedding photoshoot in Ooty.",
  openGraph: {
    title: "Pre-Wedding Photoshoot in Ooty",
    description:
      "Best locations, photographers, and logistics for an Ooty pre-wedding shoot.",
  },
};

export default function OotyPhotoshootPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <OotyResearchContent />
      </main>
    </>
  );
}
