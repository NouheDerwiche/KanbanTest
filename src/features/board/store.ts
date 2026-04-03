import { create } from "zustand";
import type { Task, TaskStatus } from "./types";

interface BoardState {
  tasks: Task[];
  searchQuery: string;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: number, updates: Partial<Task>) => void;
  deleteTask: (id: number) => void;
  moveTask: (id: number, newStatus: TaskStatus) => void;
  reorderTasks: (status: TaskStatus, orderedIds: number[]) => void;
  setSearchQuery: (query: string) => void;
  filters: {
    priority: string | "all";
    status: string | "all";
    date: Date | null;
  };
  setFilters: (filters: Partial<BoardState["filters"]>) => void;
  resetFilters: () => void;
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTaskCount: (status: TaskStatus) => number;
  // Pagination
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  currentPage: Record<TaskStatus, number>;
  setCurrentPage: (status: TaskStatus, page: number) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  tasks: [],
  searchQuery: "",
  filters: {
    priority: "all",
    status: "all",
    date: null,
  },
  itemsPerPage: 5,
  currentPage: {
    todo: 1,
    "in-progress": 1,
    done: 1,
  },

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  moveTask: (id, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: newStatus } : t
      ),
    })),

  reorderTasks: (status, orderedIds) =>
    set((state) => {
      const otherTasks = state.tasks.filter((t) => t.status !== status);
      const reorderedTasks = orderedIds
        .map((id) => state.tasks.find((t) => t.id === id))
        .filter(Boolean) as Task[];
      return { tasks: [...otherTasks, ...reorderedTasks] };
    }),

  setSearchQuery: (query) =>
    set({
      searchQuery: query,
      currentPage: { todo: 1, "in-progress": 1, done: 1 },
    }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      currentPage: { todo: 1, "in-progress": 1, done: 1 },
    })),

  resetFilters: () =>
    set({
      filters: {
        priority: "all",
        status: "all",
        date: null,
      },
      searchQuery: "",
      currentPage: { todo: 1, "in-progress": 1, done: 1 },
    }),

  setItemsPerPage: (count) =>
    set({
      itemsPerPage: count,
      currentPage: { todo: 1, "in-progress": 1, done: 1 }
    }),

  setCurrentPage: (status, page) =>
    set((state) => ({
      currentPage: { ...state.currentPage, [status]: page },
    })),

  getTasksByStatus: (status) => {
    const { tasks, searchQuery, filters } = get();

    if (filters.status !== "all" && filters.status !== status) {
      return [];
    }

    let filtered = tasks.filter((t) => t.status === status);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    if (filters.priority !== "all") {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }

    if (filters.date) {
      const filterDateStr = filters.date.toISOString().split("T")[0];
      filtered = filtered.filter((t) =>
        (t.dueDate && t.dueDate === filterDateStr) ||
        (t.startDate && t.startDate === filterDateStr)
      );
    }

    return filtered;
  },

  getTaskCount: (status) => {
    return get().getTasksByStatus(status).length;
  },
}));
