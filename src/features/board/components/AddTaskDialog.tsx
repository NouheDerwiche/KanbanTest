import { useState } from "react";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in-progress", "done"]),
  startDate: z.date({
    message: "Start Date is required",
  }),
  dueDate: z.date({
    message: "Due Date is required",
  }),
}).refine((data) => data.dueDate >= data.startDate, {
  message: "Due date cannot be before Start date",
  path: ["dueDate"],
});
import { toast } from "sonner";
import type { Priority, TaskStatus } from "../types";
import { useBoardStore } from "../store";
import { useCreateTaskMutation } from "../hooks/useTasks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: TaskStatus;
}

export const AddTaskDialog = ({ isOpen, onClose, defaultStatus = "todo" }: AddTaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [startDate, setStartDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addTask = useBoardStore((state) => state.addTask);
  const createMutation = useCreateTaskMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = taskSchema.safeParse({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      startDate,
      dueDate,
    });

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0] !== undefined) {
          formattedErrors[String(issue.path[0])] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    const task = {
      title: result.data.title,
      description: result.data.description,
      priority: result.data.priority,
      status: result.data.status,
      startDate: format(result.data.startDate, "yyyy-MM-dd"),
      dueDate: format(result.data.dueDate, "yyyy-MM-dd"),
    };

    try {
      const created = await createMutation.mutateAsync(task);
      addTask(created);
      toast.success("Task added successfully!");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("todo");
      setStartDate(undefined);
      setDueDate(undefined);
      setErrors({});
      onClose();
    } catch (e) {
      toast.error("Failed to add task. Please try again.");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-6 border-zinc-200/50 shadow-2xl dark:border-zinc-800/50">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold tracking-tight">Add New Task</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Create a new task for your board. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Design the new landing page"
              className="rounded-xl border-zinc-200 shadow-sm focus-visible:ring-primary focus-visible:ring-offset-0 px-4 py-2 transition-all"
              autoFocus
            />
            {errors.title && <p className="text-sm text-red-500 font-medium mt-1">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this task..."
              className="rounded-xl border-zinc-200 shadow-sm focus-visible:ring-primary focus-visible:ring-offset-0 px-4 py-3 resize-none transition-all"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
              >
                <SelectTrigger id="status" className="rounded-xl shadow-sm border-zinc-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-500 font-medium mt-1">{errors.status}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as Priority)}
              >
                <SelectTrigger id="priority" className="rounded-xl shadow-sm border-zinc-200">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      High
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-sm text-red-500 font-medium mt-1">{errors.priority}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
              <Label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-medium bg-background text-foreground hover:bg-accent/80 hover:text-accent-foreground transition-all duration-200 rounded-xl shadow-sm border-input",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 opacity-70" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && <p className="text-sm text-red-500 font-medium mt-1">{errors.startDate}</p>}
            </div>

            <div className="space-y-2 flex flex-col">
              <Label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-medium bg-background text-foreground hover:bg-accent/80 hover:text-accent-foreground transition-all duration-200 rounded-xl shadow-sm border-input",
                      !dueDate && "text-muted-foreground",
                      errors.dueDate && "border-red-500 text-red-500 bg-red-50"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 opacity-70" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && <p className="text-sm text-red-500 font-medium mt-1">{errors.dueDate}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 rounded-xl shadow-md transition-transform active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {createMutation.isPending ? "Adding..." : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
