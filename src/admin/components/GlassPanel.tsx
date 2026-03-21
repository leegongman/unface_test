import styles from "./GlassPanel.module.css";

type GlassPanelProps = {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

export function GlassPanel({
  title,
  subtitle,
  actions,
  className,
  contentClassName,
  children,
}: GlassPanelProps) {
  const panelClassName = [styles.panel, className].filter(Boolean).join(" ");
  const bodyClassName = [styles.content, contentClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={panelClassName}>
      {(title || subtitle || actions) && (
        <header className={styles.header}>
          <div>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
