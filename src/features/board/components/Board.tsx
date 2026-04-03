import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "../types";
import { useBoardStore } from "../store";
import { TaskCard } from "./TaskCard";
import { useUpdateTaskMutation } from "../hooks/useTasks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  activeId: number | null;
}

const DraggableTask = ({ task, isOverlay = false }: { task: Task; isOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    transition,
  } : undefined;

  if (isOverlay) {
    return (
      <div className="opacity-90 rotate-2 scale-105 cursor-grabbing shadow-2xl">
        <TaskCard task={task} />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30"
      )}
    >
      <TaskCard task={task} />
    </div>
  );
};

const DroppableColumn = ({ id, title, tasks }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const count = tasks.length;
  const itemsPerPage = useBoardStore((state) => state.itemsPerPage);
  const currentPage = useBoardStore((state) => state.currentPage[id]);
  const setCurrentPage = useBoardStore((state) => state.setCurrentPage);

  const totalPages = Math.ceil(count / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = tasks.slice(startIndex, startIndex + itemsPerPage);

  const columnColors: Record<TaskStatus, { border: string; bg: string; text: string; icon: string }> = {
    todo: { border: "border-t-blue-500", bg: "bg-blue-50/10", text: "text-blue-700", icon: "text-blue-500" },
    "in-progress": { border: "border-t-amber-500", bg: "bg-amber-50/10", text: "text-amber-700", icon: "text-amber-500" },
    done: { border: "border-t-green-500", bg: "bg-green-50/10", text: "text-green-700", icon: "text-green-500" },
  };

  return (
    <div className="flex flex-col h-full gap-4 w-full min-w-[300px]">
      <div className={cn(
        "flex flex-col flex-1 rounded-2xl border transition-all duration-300",
        "border-zinc-200/60 shadow-sm bg-zinc-50/30 dark:bg-zinc-900/10",
        columnColors[id].border,
        "border-t-4",
        isOver && "ring-2 ring-primary ring-opacity-20 bg-zinc-50/50"
      )}>
        <div className="p-4 flex items-center justify-between border-b bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md rounded-t-2xl px-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full shadow-sm animate-pulse ring-2 ring-white dark:ring-zinc-900 transition-all",
              id === "todo" ? "bg-blue-500 shadow-blue-200" :
                id === "in-progress" ? "bg-amber-500 shadow-amber-200" :
                  "bg-green-500 shadow-green-200"
            )} />
            <h2 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 tracking-widest uppercase">{title}</h2>
          </div>
          <Badge variant="secondary" className="h-5 px-2 text-[10px] bg-zinc-200/50 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300 font-black rounded-lg">
            {count}
          </Badge>
        </div>

        <ScrollArea className="flex-1 px-3 py-4 max-h-[calc(100vh-350px)]">
          <div
            ref={setNodeRef}
            className="flex flex-col gap-3 min-h-[400px]"
          >
            <SortableContext
              id={id}
              items={paginatedTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {paginatedTasks.map((task) => (
                  <DraggableTask key={task.id} task={task} />
                ))}
              </div>
            </SortableContext>
            {count === 0 && (
              <div className={cn(
                "text-center py-12 text-muted-foreground text-xs border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex-1 flex items-center justify-center transition-colors",
                isOver && "border-primary bg-primary/5"
              )}>
                {isOver ? "Drop here!" : "No tasks in this page"}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {totalPages > 1 && (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-2 shadow-sm">
          <Pagination>
            <PaginationContent className="flex-wrap justify-center gap-1">
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className={cn("h-7 w-7 p-0 cursor-pointer", currentPage === 1 && "pointer-events-none opacity-50")}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(id, Math.max(1, currentPage - 1));
                  }}
                >
                  <ChevronLeft className="h-3 w-3" />
                </PaginationLink>
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === pageNum}
                        className="h-7 w-7 text-[11px] cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(id, pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationEllipsis className="h-7 w-7" />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationLink
                  href="#"
                  className={cn("h-7 w-7 p-0 cursor-pointer", currentPage === totalPages && "pointer-events-none opacity-50")}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(id, Math.min(totalPages, currentPage + 1));
                  }}
                >
                  <ChevronRight className="h-3 w-3" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export const Board = () => {
  const tasks = useBoardStore((state) => state.tasks);
  const searchQuery = useBoardStore((state) => state.searchQuery);
  const filters = useBoardStore((state) => state.filters);
  const getTasksByStatus = useBoardStore((state) => state.getTasksByStatus);
  const moveTask = useBoardStore((state) => state.moveTask);
  const reorderTasks = useBoardStore((state) => state.reorderTasks);
  const setSearchQuery = useBoardStore((state) => state.setSearchQuery);
  const setFilters = useBoardStore((state) => state.setFilters);
  const resetFilters = useBoardStore((state) => state.resetFilters);
  const itemsPerPage = useBoardStore((state) => state.itemsPerPage);
  const setItemsPerPage = useBoardStore((state) => state.setItemsPerPage);
  const updateMutation = useUpdateTaskMutation();

  const [activeId, setActiveId] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const todoTasks = getTasksByStatus("todo");
  const inProgressTasks = getTasksByStatus("in-progress");
  const doneTasks = getTasksByStatus("done");

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as number;
    const overId = over.id as string | number;
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;
    const columns: TaskStatus[] = ["todo", "in-progress", "done"];
    if (columns.includes(overId as TaskStatus)) {
      const overStatus = overId as TaskStatus;
      if (activeTask.status !== overStatus) {
        moveTask(activeId, overStatus);
      }
      return;
    }
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      moveTask(activeId, overTask.status);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeId = active.id as number;
    const overId = over.id as string | number;
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;
    const columns: TaskStatus[] = ["todo", "in-progress", "done"];
    if (columns.includes(overId as TaskStatus)) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        moveTask(activeId, newStatus);
      }
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        if (activeTask.status === overTask.status) {
          const columnTasks = getTasksByStatus(activeTask.status);
          const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
          const newIndex = columnTasks.findIndex((t) => t.id === overId);
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const reordered = [...columnTasks];
            const [moved] = reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, moved);
            reorderTasks(activeTask.status, reordered.map((t) => t.id));
          }
        } else {
          moveTask(activeId, overTask.status);
        }
      }
    }
    const updatedTask = tasks.find((t) => t.id === activeId);
    if (updatedTask) {
      try {
        await updateMutation.mutateAsync(updatedTask);
      } catch (e) {
        toast.error("Failed to move task.");
      }
    }
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or description... (Press / to focus)"
              className="pl-10 rounded-xl border-zinc-200 focus-visible:ring-1"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filters.priority} onValueChange={(value) => setFilters({ priority: value })}>
              <SelectTrigger className="w-[140px] rounded-xl border-zinc-200">
                <div className="flex items-center gap-2"><Filter className="h-3 w-3 opacity-50" /><SelectValue placeholder="Priority" /></div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
              <SelectTrigger className="w-[140px] rounded-xl border-zinc-200">
                <div className="flex items-center gap-2"><Layers className="h-3 w-3 opacity-50" /><span>{itemsPerPage} per page</span></div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 per column</SelectItem>
                <SelectItem value="5">5 per column</SelectItem>
                <SelectItem value="10">10 per column</SelectItem>
                <SelectItem value="20">20 per column</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({ status: value })}>
              <SelectTrigger className="w-[140px] rounded-xl border-zinc-200">
                <div className="flex items-center gap-2"><Filter className="h-3 w-3 opacity-50" /><SelectValue placeholder="Status" /></div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal rounded-xl border-zinc-200", !filters.date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                  {filters.date ? format(filters.date, "PPP") : <span>Filter by date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border border-zinc-200 rounded-xl shadow-xl" align="start">
                <Calendar mode="single" selected={filters.date || undefined} onSelect={(date) => setFilters({ date: date || null })} initialFocus />
              </PopoverContent>
            </Popover>

            {(searchQuery || filters.priority !== "all" || filters.status !== "all" || filters.date) && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-zinc-500 hover:text-zinc-900 transition-colors">
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-10">
          <DroppableColumn id="todo" title="To Do" tasks={todoTasks} activeId={activeId} />
          <DroppableColumn id="in-progress" title="In Progress" tasks={inProgressTasks} activeId={activeId} />
          <DroppableColumn id="done" title="Done" tasks={doneTasks} activeId={activeId} />
        </div>
        <DragOverlay>{activeTask && <DraggableTask task={activeTask} isOverlay />}</DragOverlay>
      </DndContext>
    </div>
  );
};
