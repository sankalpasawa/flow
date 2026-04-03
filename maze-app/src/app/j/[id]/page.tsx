import { createServiceClient } from "@/lib/supabase";
import { DEMO_JOKES } from "@/lib/demo-data";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JokePageClient } from "./client";

interface Props {
  params: Promise<{ id: string }>;
}

async function getJoke(id: string) {
  const supabase = createServiceClient();
  if (!supabase) {
    return DEMO_JOKES.find((j) => j.id === id) || null;
  }
  const { data } = await supabase
    .from("content")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const joke = await getJoke(id);

  if (!joke) {
    return { title: "Maze — Never Stop Laughing" };
  }

  const title = joke.title || "Maze — Check this out 😂";
  const description = joke.body.slice(0, 150);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/j/${id}`,
    },
  };
}

export default async function JokePage({ params }: Props) {
  const { id } = await params;
  const joke = await getJoke(id);

  if (!joke) {
    notFound();
  }

  return <JokePageClient joke={joke} />;
}
