export interface Todo {
  todoId: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoCreateRequest {
  title: string;
  categoryId: string;
  description?: string | null;
  dueDate?: string | null;
}

export interface TodoUpdateRequest {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  categoryId?: string;
}

export interface TodoFilters {
  categoryId?: string;
  isCompleted?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
}
