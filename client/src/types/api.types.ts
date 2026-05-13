export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}
