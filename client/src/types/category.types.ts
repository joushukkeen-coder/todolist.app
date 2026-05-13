export interface Category {
  categoryId: string;
  userId: string | null;
  name: string;
  colorCode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CategoryCreateRequest {
  name: string;
  colorCode: string;
}

export interface CategoryUpdateRequest {
  name?: string;
  colorCode?: string;
}
