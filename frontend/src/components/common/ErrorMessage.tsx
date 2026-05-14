import type { AxiosError } from 'axios';
import type { ApiErrorBody } from '@/types/api.types';
import './ErrorMessage.css';

interface ErrorMessageProps {
  error: string | Error | AxiosError<ApiErrorBody> | null | undefined;
}

function resolveMessage(error: ErrorMessageProps['error']): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error;
  const axiosBody = (error as AxiosError<ApiErrorBody>).response?.data?.error;
  if (axiosBody?.message) return axiosBody.message;
  if (error instanceof Error) return error.message;
  return '알 수 없는 오류가 발생했습니다';
}

export default function ErrorMessage({ error }: ErrorMessageProps) {
  const message = resolveMessage(error);
  if (!message) return null;
  return (
    <p role="alert" className="error-message">
      {message}
    </p>
  );
}
