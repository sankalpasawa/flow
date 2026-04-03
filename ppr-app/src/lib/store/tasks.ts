"use client";

import { Task, TaskInsert } from "@/types";

const STORAGE_KEY = "ppr_tasks";

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export function getTasks(): Task[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedTasks();
  return JSON.parse(raw);
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addTask(input: TaskInsert): Task {
  const tasks = getTasks();
  const task: Task = {
    ...input,
    id: generateId(),
    created_at: now(),
    updated_at: now(),
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

export function updateTask(id: string, updates: Partial<TaskInsert>): Task | null {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates, updated_at: now() };
  saveTasks(tasks);
  return tasks[idx];
}

export function deleteTask(id: string): boolean {
  const tasks = getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (filtered.length === tasks.length) return false;
  saveTasks(filtered);
  return true;
}

export function toggleTaskStatus(id: string): Task | null {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const current = tasks[idx].status;
  tasks[idx].status = current === "done" ? "todo" : "done";
  tasks[idx].updated_at = now();
  saveTasks(tasks);
  return tasks[idx];
}

/** Seed with sample wedding tasks on first load */
function seedTasks(): Task[] {
  const seeds: TaskInsert[] = [
    { title: "Book wedding venue site visit", category: "Logistics", status: "todo", priority: "high", due_date: "2026-04-15", notes: null },
    { title: "Shortlist men's wedding outfits", category: "Shopping", status: "todo", priority: "high", due_date: "2026-04-20", notes: "Check Sabyasachi, Anita Dongre, Manyavar" },
    { title: "Send save-the-date cards", category: "Creative", status: "todo", priority: "medium", due_date: "2026-04-30", notes: null },
    { title: "Finalize guest list", category: "Family", status: "in_progress", priority: "high", due_date: "2026-04-10", notes: "Waiting on bride's side confirmation" },
    { title: "Book photographer", category: "Logistics", status: "todo", priority: "high", due_date: "2026-04-25", notes: "Get quotes from at least 3" },
    { title: "Research sangeet playlist", category: "Romance", status: "todo", priority: "low", due_date: "2026-05-15", notes: null },
    { title: "Order wedding invitations", category: "Creative", status: "todo", priority: "medium", due_date: "2026-05-01", notes: "Design approved, need to finalize printer" },
    { title: "Marriage registration documents", category: "Documents", status: "todo", priority: "high", due_date: "2026-05-30", notes: "Need ID proofs, address proof, photos" },
    { title: "Bride's mehndi artist booking", category: "Bride", status: "todo", priority: "medium", due_date: "2026-05-15", notes: null },
    { title: "Book pandit for ceremony", category: "Ceremony", status: "todo", priority: "high", due_date: "2026-04-20", notes: "Confirm muhurat timing" },
    { title: "Plan honeymoon destination", category: "Romance", status: "todo", priority: "low", due_date: "2026-06-01", notes: "Maldives vs Bali vs Europe" },
    { title: "Buy wedding rings", category: "Shopping", status: "todo", priority: "high", due_date: "2026-06-15", notes: null },
    { title: "Book pre-wedding photoshoot in Ooty", category: "Creative", status: "in_progress", priority: "high", due_date: "2026-05-15", notes: "Research locations, photographers, and logistics. Best months: Feb-May before monsoon." },
  ];

  const tasks: Task[] = seeds.map((s) => ({
    ...s,
    id: generateId(),
    created_at: now(),
    updated_at: now(),
  }));

  saveTasks(tasks);
  return tasks;
}
