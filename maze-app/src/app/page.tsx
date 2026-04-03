import { Feed } from "@/components/feed";

export default function Home() {
  return (
    <main className="flex-1 px-4 py-6">
      {/* Header */}
      <div className="max-w-lg mx-auto mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Maze{" "}
          <span className="text-muted-foreground font-normal text-lg">
            — never stop laughing
          </span>
        </h1>
      </div>

      {/* Feed */}
      <Feed />
    </main>
  );
}
