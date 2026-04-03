import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

interface IngestResult {
  source: string;
  fetched: number;
  inserted: number;
  duplicates: number;
  errors: string[];
}

// JokeAPI — free, no auth, 6 categories
async function fetchJokeAPI(): Promise<IngestResult> {
  const result: IngestResult = {
    source: "jokeapi",
    fetched: 0,
    inserted: 0,
    duplicates: 0,
    errors: [],
  };

  const categories = [
    "Programming",
    "Misc",
    "Dark",
    "Pun",
    "Spooky",
    "Christmas",
  ];

  const jokes: Array<{
    type: string;
    category: string;
    title: string | null;
    body: string;
    source_id: string;
  }> = [];

  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://v2.jokeapi.dev/joke/${cat}?amount=10&type=twopart,single`,
      );
      const data = await res.json();

      if (data.error) {
        result.errors.push(`JokeAPI ${cat}: ${data.message}`);
        continue;
      }

      const items = data.jokes || [data];
      for (const joke of items) {
        result.fetched++;
        if (joke.type === "twopart") {
          jokes.push({
            type: joke.category === "Dark" ? "dark_joke" : "text_joke",
            category: mapJokeAPICategory(joke.category),
            title: joke.setup,
            body: joke.delivery,
            source_id: `jokeapi-${joke.id}`,
          });
        } else {
          jokes.push({
            type: joke.category === "Dark" ? "dark_joke" : "one_liner",
            category: mapJokeAPICategory(joke.category),
            title: null,
            body: joke.joke,
            source_id: `jokeapi-${joke.id}`,
          });
        }
      }
    } catch (e) {
      result.errors.push(
        `JokeAPI ${cat}: ${e instanceof Error ? e.message : "fetch failed"}`,
      );
    }
  }

  // Bulk insert
  const supabase = createServiceClient();
  for (const joke of jokes) {
    const { error } = await supabase.from("content").upsert(
      {
        type: joke.type,
        category: joke.category,
        title: joke.title,
        body: joke.body,
        source: "jokeapi",
        source_id: joke.source_id,
        is_active: true,
      },
      { onConflict: "source,source_id", ignoreDuplicates: true },
    );

    if (error) {
      result.duplicates++;
    } else {
      result.inserted++;
    }
  }

  return result;
}

// icanhazdadjoke — free, no auth, dad jokes
async function fetchDadJokes(): Promise<IngestResult> {
  const result: IngestResult = {
    source: "icanhazdadjoke",
    fetched: 0,
    inserted: 0,
    duplicates: 0,
    errors: [],
  };

  const supabase = createServiceClient();

  // Fetch multiple pages of dad jokes via search
  const searchTerms = [
    "dog",
    "cat",
    "car",
    "food",
    "work",
    "doctor",
    "wife",
    "kid",
    "phone",
    "coffee",
    "computer",
    "money",
    "fish",
    "chicken",
    "dad",
    "school",
    "music",
    "time",
    "water",
    "house",
  ];

  for (const term of searchTerms) {
    try {
      const res = await fetch(
        `https://icanhazdadjoke.com/search?term=${term}&limit=10`,
        {
          headers: { Accept: "application/json" },
        },
      );
      const data = await res.json();

      for (const joke of data.results || []) {
        result.fetched++;
        const { error } = await supabase.from("content").upsert(
          {
            type: "dad_joke",
            category: "dad_jokes",
            title: null,
            body: joke.joke,
            source: "icanhazdadjoke",
            source_id: `dadjoke-${joke.id}`,
            is_active: true,
          },
          { onConflict: "source,source_id", ignoreDuplicates: true },
        );

        if (error) {
          result.duplicates++;
        } else {
          result.inserted++;
        }
      }
    } catch (e) {
      result.errors.push(
        `DadJoke search "${term}": ${e instanceof Error ? e.message : "fetch failed"}`,
      );
    }
  }

  return result;
}

// Official Joke API — free, no auth, ~300 jokes
async function fetchOfficialJokeAPI(): Promise<IngestResult> {
  const result: IngestResult = {
    source: "official_joke_api",
    fetched: 0,
    inserted: 0,
    duplicates: 0,
    errors: [],
  };

  try {
    const res = await fetch(
      "https://official-joke-api.appspot.com/jokes/ten",
    );
    const jokes = await res.json();

    const supabase = createServiceClient();

    for (const joke of jokes) {
      result.fetched++;
      const { error } = await supabase.from("content").upsert(
        {
          type: "text_joke",
          category: mapOfficialCategory(joke.type),
          title: joke.setup,
          body: joke.punchline,
          source: "official_joke_api",
          source_id: `official-${joke.id}`,
          is_active: true,
        },
        { onConflict: "source,source_id", ignoreDuplicates: true },
      );

      if (error) {
        result.duplicates++;
      } else {
        result.inserted++;
      }
    }
  } catch (e) {
    result.errors.push(
      `OfficialJokeAPI: ${e instanceof Error ? e.message : "fetch failed"}`,
    );
  }

  return result;
}

function mapJokeAPICategory(cat: string): string {
  const map: Record<string, string> = {
    Programming: "programming",
    Misc: "general",
    Dark: "dark_humor",
    Pun: "pun",
    Spooky: "general",
    Christmas: "general",
  };
  return map[cat] || "general";
}

function mapOfficialCategory(type: string): string {
  const map: Record<string, string> = {
    general: "general",
    programming: "programming",
    "knock-knock": "general",
    dad: "dad_jokes",
  };
  return map[type] || "general";
}

export async function GET(request: Request) {
  // Simple auth via secret header to prevent abuse
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.INGEST_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: IngestResult[] = [];

  // Fetch from all sources in parallel
  const [jokeApi, dadJokes, officialApi] = await Promise.all([
    fetchJokeAPI(),
    fetchDadJokes(),
    fetchOfficialJokeAPI(),
  ]);

  results.push(jokeApi, dadJokes, officialApi);

  // Log ingestion
  const supabase = createServiceClient();
  const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
  const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
  const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates, 0);
  const allErrors = results.flatMap((r) => r.errors);

  await supabase.from("ingestion_log").insert({
    source: "all",
    fetched_count: totalFetched,
    new_count: totalInserted,
    duplicate_count: totalDuplicates,
    error: allErrors.length > 0 ? allErrors.join("; ") : null,
  });

  return NextResponse.json({
    success: true,
    total_fetched: totalFetched,
    total_inserted: totalInserted,
    total_duplicates: totalDuplicates,
    errors: allErrors,
    details: results,
  });
}
