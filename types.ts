
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
  createdAt: number;
}

export interface UserStats {
  completedDaysCount: number;
  lastCompletionDate: string | null;
}
