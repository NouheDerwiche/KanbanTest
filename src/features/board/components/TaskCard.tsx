import { useState } from "react";
import type { Task, Priority } from "../types";
import { useBoardStore } from "../store";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "../hooks/useTasks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, AlertCircle, CalendarIcon, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
}

const priorityConfig: Record<Priority, { color: string; label: string; dot: string; text: string }> = {
  low: {
    color: "border-t-blue-500/50 hover:border-t-blue-500 bg-blue-50/20",
    label: "Low",
    dot: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400"
  },
  medium: {
    color: "border-t-amber-500/50 hover:border-t-amber-500 bg-amber-50/20",
    label: "Medium",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400"
  },
  high: {
    color: "border-t-rose-500/50 hover:border-t-rose-500 bg-rose-50/20",
    label: "High",
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400"
  },
};

export const TaskCard = ({ task }: TaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(
    task.startDate ? parseISO(task.startDate) : undefined
  );
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(
    task.dueDate ? parseISO(task.dueDate) : undefined
  );

  const updateTask = useBoardStore((state) => state.updateTask);
  const deleteTask = useBoardStore((state) => state.deleteTask);
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();

  const isDone = task.status === "done";
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

  const handleSave = async () => {
    if (!editTitle.trim()) return;

    if (editStartDate && editDueDate && editDueDate < editStartDate) {
      toast.error("Due date cannot be before start date.");
      return;
    }

    const updates = {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      priority: editPriority,
      startDate: editStartDate && isValid(editStartDate) ? format(editStartDate, "yyyy-MM-dd") : undefined,
      dueDate: editDueDate && isValid(editDueDate) ? format(editDueDate, "yyyy-MM-dd") : undefined,
    };

    try {
      updateTask(task.id, updates);
      await updateMutation.mutateAsync({ ...task, ...updates });
      setIsEditing(false);
      toast.success("Task updated successfully!");
    } catch (e) {
      toast.error("Failed to update task.");
    }
  };

  const handleDelete = async () => {
    try {
      deleteTask(task.id);
      await deleteMutation.mutateAsync(task.id);
      setShowDeleteConfirm(false);
      toast.success("Task deleted!");
    } catch (e) {
      toast.error("Failed to delete task.");
    }
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditStartDate(task.startDate ? parseISO(task.startDate) : undefined);
    setEditDueDate(task.dueDate ? parseISO(task.dueDate) : undefined);
    setIsEditing(false);
  };

  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <motion.div
          key="editing"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-t-4 border-t-primary shadow-lg">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Task title"
                  className="font-semibold text-base bg-zinc-50/50 border-zinc-200 focus-visible:ring-primary h-10 px-3"
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                  className="text-sm bg-zinc-50/50 border-zinc-200 focus-visible:ring-primary resize-none min-h-[100px] px-3 py-2"
                />
              </div>

              <div className="flex flex-col gap-4 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Select
                    value={editPriority}
                    onValueChange={(value) => setEditPriority(value as Priority)}
                  >
                    <SelectTrigger className="w-fit h-8 text-xs border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-sm">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Start</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start h-8 text-[11px] px-2 font-normal">
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {editStartDate ? format(editStartDate, "PP") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editStartDate} onSelect={setEditStartDate} /></PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Due</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("w-full justify-start h-8 text-[11px] px-2 font-normal", (editDueDate && editStartDate && editDueDate < editStartDate) && "border-red-500 text-red-500")}>
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {editDueDate ? format(editDueDate, "PP") : "Due date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editDueDate} onSelect={setEditDueDate} /></PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button onClick={handleCancel} variant="outline" size="sm" className="rounded-xl border-zinc-200">Cancel</Button>
                <Button onClick={handleSave} size="sm" className="px-6 rounded-xl shadow-md transition-all active:scale-95 bg-zinc-900 text-white hover:bg-zinc-800">Save</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : showDeleteConfirm ? (
        <motion.div
          key="delete"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <Card className="border-red-500 border-2 bg-red-50/50">
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm font-medium">Delete this task permanently?</p>
              <div className="flex gap-2 w-full">
                <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" size="sm" className="flex-1">Keep it</Button>
                <Button onClick={handleDelete} variant="destructive" size="sm" className="flex-1">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          className="group"
        >
          <Card className={cn(
            "group/card relative border border-zinc-200/50 dark:border-zinc-800/50 border-t-2 transition-all duration-300",
            "hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 overflow-hidden",
            priorityConfig[task.priority].color,
            isDone && "opacity-70 grayscale-[0.3]"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            <div className="relative p-4 pb-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", priorityConfig[task.priority].dot)} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {priorityConfig[task.priority].label}
                    </span>
                  </div>
                  <h3 className={cn(
                    "text-sm font-semibold leading-relaxed text-zinc-900 dark:text-zinc-100",
                    isDone && "line-through opacity-50"
                  )}>
                    {task.title}
                  </h3>
                </div>

                <div className="flex gap-1.5 bg-white/90 dark:bg-zinc-800/90 p-1 rounded-xl opacity-0 group-hover/card:opacity-100 transition-all duration-300 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm translate-y-1 group-hover/card:translate-y-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-all duration-200" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 transition-all duration-200" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {task.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-normal">
                  {task.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 px-2 py-1 rounded-lg border border-zinc-200/50 dark:border-zinc-700/30">
                  <div className={cn(
                    "flex items-center gap-1.5 text-[10px] font-bold tracking-tight",
                    isDone ? "text-green-600 dark:text-green-400" : (isOverdue ? "text-rose-600 dark:text-rose-400" : "text-zinc-600 dark:text-zinc-400")
                  )}>
                    <CalendarIcon className="h-3 w-3" />
                    {task.dueDate ? format(parseISO(task.dueDate), "MMM dd") : "No date"}
                    {isDone && <CheckCircle2 className="h-3 w-3 ml-0.5 animate-in zoom-in duration-300" />}
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 font-medium italic">
                  #{task.id.toString().slice(-4)}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
