import { getTasks, createTask, updateTask, deleteTask } from "../api/tasks";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const TASKS_KEY = "tasks";

export const useTasksQuery = () => {
  return useQuery({
    queryKey: [TASKS_KEY],
    queryFn: getTasks,
  });
};

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
    },
  });
};

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
    },
  });
};
