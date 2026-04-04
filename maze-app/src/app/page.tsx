import { Feed } from "@/components/feed";
import { AIJokes } from "@/components/ai-jokes";

export default function Home() {
  return (
    <main className="flex-1 px-4 py-6 pb-20">
      {/* Header */}
      <div className="max-w-lg mx-auto mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Maze{" "}
          <span className="text-muted-foreground font-normal text-lg">
            — never stop laughing
          </span>
        </h1>
      </div>

      {/* AI Joke Generator */}
      <AIJokes />

      {/* Separator */}
      <div className="max-w-lg mx-auto my-8 flex items-center gap-4">
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">
          The Feed
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* Feed */}
      <Feed />
    </main>
  );
}
