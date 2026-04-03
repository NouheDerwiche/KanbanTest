import { useState, useEffect } from "react";
import { Board } from "./Board";
import { AddTaskDialog } from "./AddTaskDialog";
import { useBoardStore } from "../store";
import { useTasksQuery } from "../hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw, Keyboard } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const KanbanBoard = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const setTasks = useBoardStore((state) => state.setTasks);

  const { data, isLoading, error } = useTasksQuery();

  useEffect(() => {
    if (data) {
      setTasks(data);
    }
  }, [data, setTasks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + N or Alt + N to add task
      if ((e.shiftKey && e.key === "N") || (e.altKey && e.key === "n")) {
        e.preventDefault();
        setIsAddDialogOpen(true);
      }
      // Alt + R to refresh
      if (e.altKey && e.key === "r") {
        e.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4 font-medium">Failed to load tasks</p>
          <Button
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kanban Board</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-primary transition-colors">
                <Keyboard className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-4 w-80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b pb-2">Navigation Board</div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-zinc-600">New Task</span>
                    <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 shadow-sm text-[10px] font-mono font-bold">Alt + N</kbd>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-zinc-600">Focus Search</span>
                    <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 shadow-sm text-[10px] font-mono font-bold">/</kbd>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-zinc-600">Refresh Board</span>
                    <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 shadow-sm text-[10px] font-mono font-bold">Alt + R</kbd>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-zinc-600">Drag/Move Task</span>
                    <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 shadow-sm text-[10px] font-mono font-bold">Space + Arrows</kbd>
                  </div>
                </div>

                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b pb-2 pt-2">Calendar Navigation</div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-zinc-600">Navigate between Days</span>
                    <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 shadow-sm text-[10px] font-mono font-bold">← ↑ ↓ →</kbd>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-zinc-600">Select focused Date</span>
                    <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 shadow-sm text-[10px] font-mono font-bold">Enter</kbd>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="rounded-xl shadow-md transition-transform active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Task
        </Button>
      </div>

      <Board />

      <AddTaskDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </div>
  );
};
