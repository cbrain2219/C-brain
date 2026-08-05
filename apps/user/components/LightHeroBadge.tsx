import type { ComponentPropsWithoutRef } from "react";

import styles from "./LightHeroBadge.module.css";

type LightHeroBadgeProps = ComponentPropsWithoutRef<"p">;

export function LightHeroBadge({ className, ...props }: LightHeroBadgeProps) {
  return (
    <p
      {...props}
      className={[styles.badge, className].filter(Boolean).join(" ")}
    />
  );
}
