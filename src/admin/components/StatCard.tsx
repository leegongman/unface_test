import styles from "./StatCard.module.css";

type StatCardProps = {
  label: string;
  value: string;
  description: string;
  trend?: string;
  accent?: "mint" | "purple" | "amber" | "rose";
};

export function StatCard({
  label,
  value,
  description,
  trend,
  accent = "mint",
}: StatCardProps) {
  return (
    <article className={[styles.card, styles[accent]].join(" ")}>
      <div className={styles.topRow}>
        <span className={styles.label}>{label}</span>
        {trend ? <span className={styles.trend}>{trend}</span> : null}
      </div>
      <strong className={styles.value}>{value}</strong>
      <p className={styles.description}>{description}</p>
    </article>
  );
}
