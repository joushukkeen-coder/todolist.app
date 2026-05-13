import './CategoryBadge.css';

interface Props {
  name: string;
  colorCode: string;
}

export default function CategoryBadge({ name, colorCode }: Props) {
  return (
    <span className="cat-badge" style={{ backgroundColor: colorCode }}>
      {name}
    </span>
  );
}
