
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum TaskCategory {
  WORK = 'Công việc',
  PERSONAL = 'Cá nhân',
  SHOPPING = 'Mua sắm',
  HEALTH = 'Sức khỏe',
  OTHER = 'Khác'
}

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

// Added AIPlanResponse interface to fix the import error in geminiService.ts
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
  lastCompletionDate: string | null; // Định dạng YYYY-MM-DD
}