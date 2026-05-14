import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function Spinner({ size = 'md', label = '처리 중' }: SpinnerProps) {
  return (
    <span
      className={`spinner spinner--${size}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      data-testid="spinner"
    />
  );
}
