"use client";

import {
  type CSSProperties,
  type DetailsHTMLAttributes,
  type ReactNode,
  type SyntheticEvent,
  forwardRef,
  useState,
} from "react";

export interface AccordionProps extends Omit<
  DetailsHTMLAttributes<HTMLDetailsElement>,
  "children" | "onToggle" | "open"
> {
  answer: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  question: ReactNode;
}

const detailsStyle: CSSProperties = {
  width: 350,
  boxSizing: "border-box",
  padding: 0,
  border: "1px solid var(--accordion-border-color, #e9ecf2)",
  borderRadius: "var(--accordion-radius, 16px)",
  background: "var(--accordion-background, #ffffff)",
  color: "var(--accordion-color, #1b1f2a)",
  fontFamily: "var(--font-sans)",
};

const summaryStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "16px 20px",
  listStyle: "none",
  cursor: "pointer",
};

const questionStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "normal",
  fontSize: 14,
  fontWeight: "var(--accordion-question-font-weight, 700)",
  lineHeight: "var(--accordion-question-line-height, 21px)",
  letterSpacing: "var(--accordion-question-letter-spacing, 0)",
  color: "var(--accordion-question-color, inherit)",
};

const iconStyle: CSSProperties = {
  flex: "0 0 auto",
};

const contentStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: "0 20px 16px",
};

const dividerStyle: CSSProperties = {
  width: "100%",
  height: 1,
  background:
    "var(--accordion-divider-background, var(--accordion-divider-color, #e9ecf2))",
};

const answerStyle: CSSProperties = {
  color: "var(--accordion-answer-color, #1b1f2a)",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "var(--accordion-answer-line-height, 21px)",
  letterSpacing: "var(--accordion-answer-letter-spacing, -0.21px)",
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      style={iconStyle}
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={
          open
            ? "M5.833 11.667L10 7.5L14.167 11.667"
            : "M5.833 8.333L10 12.5L14.167 8.333"
        }
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export const Accordion = forwardRef<HTMLDetailsElement, AccordionProps>(
  (
    {
      answer,
      className,
      defaultOpen = false,
      onOpenChange,
      open,
      question,
      style,
      ...props
    },
    ref,
  ) => {
    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = isControlled ? open : internalOpen;

    const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
      const nextOpen = event.currentTarget.open;
      if (!isControlled) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    };

    return (
      <details
        {...props}
        className={className}
        onToggle={handleToggle}
        open={isOpen}
        ref={ref}
        style={{ ...detailsStyle, ...style }}
      >
        <summary style={{ ...summaryStyle, paddingBottom: isOpen ? 12 : 16 }}>
          <span style={questionStyle}>{question}</span>
          <ChevronIcon open={isOpen} />
        </summary>
        <div style={contentStyle}>
          <span aria-hidden="true" style={dividerStyle} />
          <div style={answerStyle}>{answer}</div>
        </div>
      </details>
    );
  },
);

Accordion.displayName = "Accordion";
