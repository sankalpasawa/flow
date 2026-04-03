"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, TaskInsert, CATEGORIES, Category } from "@/types";
import { getTasks, addTask, updateTask, deleteTask, toggleTaskStatus } from "@/lib/store/tasks";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskListProps {
  /** If provided, only show tasks matching this filter */
  filter?: "today" | "overdue" | "all";
}

export function TaskList({ filter = "all" }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(() => {
    let loaded = getTasks();

    // Apply date filter
    const today = new Date().toISOString().split("T")[0];
    if (filter === "today") {
      loaded = loaded.filter(
        (t) => t.status !== "done" && t.due_date && t.due_date <= today
      );
    } else if (filter === "overdue") {
      loaded = loaded.filter(
        (t) => t.status !== "done" && t.due_date && t.due_date < today
      );
    }

    // Sort: high priority first, then by due date
    loaded.sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

    setTasks(loaded);
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function handleToggle(id: string) {
    toggleTaskStatus(id);
    loadTasks();
  }

  function handleEdit(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  function handleDelete(id: string) {
    deleteTask(id);
    loadTasks();
  }

  function handleSave(data: TaskInsert) {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    setEditingTask(null);
    loadTasks();
  }

  function handleOpenForm() {
    setEditingTask(null);
    setFormOpen(true);
  }

  const filteredTasks =
    selectedCategory === "all"
      ? tasks
      : tasks.filter((t) => t.category === selectedCategory);

  const todoCount = filteredTasks.filter((t) => t.status !== "done").length;
  const doneCount = filteredTasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-4">
      {/* Category filter pills */}
      {filter === "all" && (
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={selectedCategory === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory("all")}
          >
            All ({tasks.length})
          </Badge>
          {CATEGORIES.map((cat) => {
            const count = tasks.filter((t) => t.category === cat).length;
            if (count === 0) return null;
            return (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} ({count})
              </Badge>
            );
          })}
        </div>
      )}

      {/* Stats + add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {todoCount} remaining{doneCount > 0 ? ` · ${doneCount} done` : ""}
        </p>
        <Button size="sm" onClick={handleOpenForm}>
          + Add Task
        </Button>
      </div>

      {/* Task cards */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {filter === "today"
              ? "Nothing due today. You're all caught up!"
              : "No tasks yet. Add one to get started."}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        onSave={handleSave}
      />
    </div>
  );
}
