import { Icon } from "../../../components/Icon";
import { orderSteps } from "../../_content/order";
import styles from "./page.module.css";

type OrderProgressProps = {
  activeStepIndex: number;
};

export function OrderProgress({ activeStepIndex }: OrderProgressProps) {
  return (
    <ol className={styles.stepList} aria-label="주문 진행 단계">
      {orderSteps.map((step, index) => {
        const isActive = index === activeStepIndex;

        return (
          <li
            aria-current={isActive ? "step" : undefined}
            className={`${styles.stepItem} ${
              isActive ? styles.stepItemActive : ""
            }`}
            key={step.number}
          >
            <span className={styles.stepContent}>
              <span className={styles.stepChip}>{step.number}</span>
              <span className={styles.stepLabel}>{step.label}</span>
            </span>
            {index < orderSteps.length - 1 ? (
              <Icon
                className={styles.stepChevron}
                name="chevron-right"
                size={16}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
