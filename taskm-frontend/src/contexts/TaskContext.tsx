import React, { createContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigneeId: string;
  assigneeName: string;
  dueDate: string;
  githubLink?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'REORDER_TASKS'; payload: Task[] }
  | { type: 'SET_ERROR'; payload: string };

export const TaskContext = createContext<{
  state: TaskState;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
} | null>(null);

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'REORDER_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};


export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    loading: false,
    error: null,
  });

  const auth = useAuth();

  useEffect(() => {
    // wait until auth is initialized; only fetch when user is present
    if (!auth.state.initialized) return;
    if (!auth.state.user) return;

    const fetchTasks = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const res = await axios.get('/api/tasks', { withCredentials: true, timeout: 5000 });
        dispatch({ type: 'SET_TASKS', payload: res.data });
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to fetch tasks' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch tasks' });
        }
      }
    };
    fetchTasks();
  }, [auth.state.initialized, auth.state.user]);

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await axios.post('/api/tasks', taskData, { withCredentials: true, timeout: 5000 });
      dispatch({ type: 'ADD_TASK', payload: res.data });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to create task' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create task' });
      }
    }
  };

  const updateTask = async (task: Task) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await axios.put(`/api/tasks/${task.id}`, task, { withCredentials: true, timeout: 5000 });
      dispatch({ type: 'UPDATE_TASK', payload: res.data });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to update task' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
      }
    }
  };

  const deleteTask = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await axios.delete(`/api/tasks/${id}`, { withCredentials: true, timeout: 5000 });
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to delete task' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
      }
    }
  };

  const reorderTasks = (tasks: Task[]) => {
    dispatch({ type: 'REORDER_TASKS', payload: tasks });
  };

  return (
    <TaskContext.Provider value={{ state, createTask, updateTask, deleteTask, reorderTasks }}>
      {children}
    </TaskContext.Provider>
  );
};


