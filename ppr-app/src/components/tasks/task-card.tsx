"use client";

import { Task, CATEGORY_COLORS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

function daysUntil(date: string | null): string {
  if (!date) return "";
  const diff = Math.ceil(
    (new Date(date).getTime() - new Date(new Date().toDateString()).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${diff}d`;
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const overdue = task.status !== "done" && isOverdue(task.due_date);
  const categoryColor = CATEGORY_COLORS[task.category];

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50",
        task.status === "done" && "opacity-60"
      )}
    >
      <Checkbox
        checked={task.status === "done"}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              task.status === "done" && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={cn("text-xs", categoryColor)}>
            {task.category}
          </Badge>
          {task.priority === "high" && (
            <Badge variant="destructive" className="text-xs">
              High
            </Badge>
          )}
          {task.due_date && (
            <span
              className={cn(
                "text-xs text-muted-foreground",
                overdue && "text-destructive font-medium"
              )}
            >
              {formatDate(task.due_date)} ({daysUntil(task.due_date)})
            </span>
          )}
        </div>
        {task.notes && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
            {task.notes}
          </p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="h-8 w-8 rounded-md p-0 text-lg leading-none opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100">
          ...
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(task)}>Edit</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(task.id)}
            className="text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
