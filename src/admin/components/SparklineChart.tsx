import styles from "./SparklineChart.module.css";

type SparklineChartProps = {
  data: number[];
  stroke?: string;
  fill?: string;
};

function buildPoints(data: number[]) {
  if (data.length === 0) {
    return "";
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(max - min, 1);

  return data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export function SparklineChart({
  data,
  stroke = "#7ef0d0",
  fill = "rgba(126, 240, 208, 0.16)",
}: SparklineChartProps) {
  const points = buildPoints(data);

  if (!points) {
    return null;
  }

  return (
    <div className={styles.frame}>
      <svg
        className={styles.svg}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <polygon
          fill={fill}
          points={`${points} 100,100 0,100`}
        />
      </svg>
    </div>
  );
}
