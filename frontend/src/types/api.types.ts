export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
