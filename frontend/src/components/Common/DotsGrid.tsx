interface DotsGridProps {
  rows?: number;
  cols?: number;
  style?: React.CSSProperties;
}

export const DotsGrid: React.FC<DotsGridProps> = ({ rows = 4, cols = 6, style }) => (
  <svg
    width={cols * 20}
    height={rows * 20}
    style={{ position: 'absolute', bottom: '8%', right: '8%', opacity: 0.6, ...style }}
  >
    {Array.from({ length: rows }).map((_, r) =>
      Array.from({ length: cols }).map((_, c) => (
        <circle
          key={`${r}-${c}`}
          cx={c * 20 + 5}
          cy={r * 20 + 5}
          r="2.5"
          fill="var(--earth-mid)"
        />
      ))
    )}
  </svg>
);
