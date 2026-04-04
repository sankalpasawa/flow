import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Maze",
  description: "How Maze handles your data",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-lg mx-auto prose prose-invert prose-sm">
        <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground text-xs mb-8">
          Last updated: April 4, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">What is Maze?</h2>
          <p className="text-foreground/80 leading-relaxed">
            Maze is a humor feed that shows you jokes, memes, and funny content.
            You can browse, like, dislike, share jokes via WhatsApp, and generate
            jokes using AI. You can use Maze without creating an account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">What Data We Collect</h2>

          <h3 className="text-sm font-medium mt-4 mb-2 text-foreground/70">
            Anonymous Session Data
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            When you visit Maze, we create an anonymous session using a random ID
            stored in your browser&apos;s local storage. This is not linked to your
            identity. We use this to:
          </p>
          <ul className="text-foreground/80 list-disc pl-5 space-y-1 mt-2">
            <li>Remember your joke preferences (what you like/dislike)</li>
            <li>Personalize your feed based on your tastes</li>
            <li>Avoid showing you the same jokes twice</li>
          </ul>

          <h3 className="text-sm font-medium mt-4 mb-2 text-foreground/70">
            Interaction Data
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            When you like, dislike, or share a joke, we record that action linked
            to your anonymous session. This helps us show you better jokes and
            surface the funniest content to everyone.
          </p>

          <h3 className="text-sm font-medium mt-4 mb-2 text-foreground/70">
            AI Generation Data
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            When you use the AI joke generator, the topic you enter is sent to
            Google&apos;s Gemini AI to generate jokes. We do not store the topics
            you enter or the jokes generated unless you explicitly like them.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            What We Do NOT Collect
          </h2>
          <ul className="text-foreground/80 list-disc pl-5 space-y-1">
            <li>Your name, email, or phone number (unless you sign up later)</li>
            <li>Your location</li>
            <li>Your contacts</li>
            <li>Any data from your WhatsApp conversations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Third-Party Services</h2>
          <p className="text-foreground/80 leading-relaxed">
            Maze uses the following third-party services:
          </p>
          <ul className="text-foreground/80 list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>Supabase</strong> — database hosting (stores jokes and
              anonymous interaction data)
            </li>
            <li>
              <strong>Vercel</strong> — website hosting
            </li>
            <li>
              <strong>Google Gemini</strong> — AI joke generation
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Data Retention</h2>
          <p className="text-foreground/80 leading-relaxed">
            Your anonymous session data is retained as long as it exists in your
            browser&apos;s local storage. Clearing your browser data removes your
            session. Interaction data in our database is retained indefinitely to
            improve content quality for all users.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Your Rights</h2>
          <p className="text-foreground/80 leading-relaxed">
            Since we don&apos;t collect personally identifiable information,
            there is no personal data to delete. If you want a fresh start,
            clear your browser&apos;s local storage — this resets your session
            and preferences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Changes</h2>
          <p className="text-foreground/80 leading-relaxed">
            If we add features that collect personal data (like optional
            accounts), we will update this policy and note the changes here.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Contact</h2>
          <p className="text-foreground/80 leading-relaxed">
            Questions about this policy? Reach out at{" "}
            <a
              href="mailto:privacy@maze.app"
              className="text-primary underline"
            >
              privacy@maze.app
            </a>
          </p>
        </section>

        <div className="mt-12 pt-6 border-t border-border/30">
          <a href="/" className="text-primary text-sm hover:underline">
            ← Back to Maze
          </a>
        </div>
      </div>
    </main>
  );
}
