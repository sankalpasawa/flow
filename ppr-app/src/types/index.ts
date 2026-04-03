export const CATEGORIES = [
  "Shopping",
  "Family",
  "Logistics",
  "Romance",
  "Bride",
  "Ceremony",
  "Documents",
  "Creative",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type TaskStatus = "todo" | "in_progress" | "done";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  category: Category;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInsert = Omit<Task, "id" | "created_at" | "updated_at">;

export const CATEGORY_COLORS: Record<Category, string> = {
  Shopping: "bg-amber-100 text-amber-800 border-amber-200",
  Family: "bg-rose-100 text-rose-800 border-rose-200",
  Logistics: "bg-blue-100 text-blue-800 border-blue-200",
  Romance: "bg-pink-100 text-pink-800 border-pink-200",
  Bride: "bg-purple-100 text-purple-800 border-purple-200",
  Ceremony: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Documents: "bg-slate-100 text-slate-800 border-slate-200",
  Creative: "bg-orange-100 text-orange-800 border-orange-200",
};
