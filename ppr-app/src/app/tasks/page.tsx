import { Header } from "@/components/layout/header";
import { TaskList } from "@/components/tasks/task-list";

export default function TasksPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">All Tasks</h1>
        <TaskList filter="all" />
      </main>
    </>
  );
}
