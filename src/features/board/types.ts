export type TaskStatus = "todo" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high";

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  startDate?: string;
  priority: Priority;
}

export interface ApiTodo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
