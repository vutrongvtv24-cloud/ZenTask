
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum TaskCategory {
  WORK = 'WORK',
  PERSONAL = 'PERSONAL',
  SHOPPING = 'SHOPPING',
  HEALTH = 'HEALTH',
  OTHER = 'OTHER'
}

export type Language = 'vi' | 'en';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string;
  createdAt: number;
}

export interface AIPlanResponse {
  tasks: {
    title: string;
    description: string;
    priority: TaskPriority;
    category: TaskCategory;
  }[];
}

export interface UserStats {
  completedDaysCount: number;
  lastCompletionDate: string | null;
}
