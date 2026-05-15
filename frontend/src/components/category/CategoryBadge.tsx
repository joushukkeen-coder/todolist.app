import './CategoryBadge.css';

interface Props {
  name: string;
  colorCode: string;
}

export default function CategoryBadge({ name, colorCode }: Props) {
  return (
    <span
      className="category-badge"
      style={{ backgroundColor: colorCode + '22', color: colorCode }}
    >
      <span className="category-badge__dot" style={{ backgroundColor: colorCode }} aria-hidden />
      {name}
    </span>
  );
}
