import { fetcher } from "../../../services/api";
import type { ApiTodo, Task } from "../types";

export const getTasks = async (): Promise<Task[]> => {
  const data = await fetcher<ApiTodo[]>("/todos");

  return data.slice(0, 20).map((item) => ({
    id: item.id,
    title: item.title,
    description: "",
    status: "todo",
    priority: "medium",
  }));
};

export const createTask = async (task: Omit<Task, "id">): Promise<Task> => {
  // Simulate API call with jsonplaceholder
  const res = await fetcher<ApiTodo>("/todos", {
    method: "POST",
    body: JSON.stringify({
      title: task.title,
      completed: task.status === "done",
    }),
  });
  // Return with the ID from the API (jsonplaceholder returns id 201)
  return {
    ...task,
    id: res.id,
  };
};

export const updateTask = async (task: Task): Promise<Task> => {
  await fetcher<ApiTodo>(`/todos/${task.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: task.title,
      completed: task.status === "done",
    }),
  });
  return task;
};

export const deleteTask = async (id: number): Promise<void> => {
  await fetcher(`/todos/${id}`, {
    method: "DELETE",
  });
};
