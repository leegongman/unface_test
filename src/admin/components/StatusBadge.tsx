import styles from "./StatusBadge.module.css";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
  label: string;
  tone?: Tone;
};

export function StatusBadge({
  label,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span className={[styles.badge, styles[tone]].join(" ")}>{label}</span>
  );
}
