import { Header } from "@/components/layout/header";
import { TaskList } from "@/components/tasks/task-list";

export default function HomePage() {
  const weddingDate = new Date("2026-07-05");
  const today = new Date();
  const daysLeft = Math.ceil(
    (weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
          <p className="text-sm text-muted-foreground">
            {daysLeft} days until the wedding
          </p>
        </div>
        <TaskList filter="today" />
      </main>
    </>
  );
}
