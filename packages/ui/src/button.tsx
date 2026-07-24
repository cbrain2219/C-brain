import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
  forwardRef,
} from "react";

type ButtonVariant = "solid" | "outline";
type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const baseStyle: CSSProperties = {
  height: 52,
  padding: "8px 16px",
  borderRadius: 16,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 700,
  lineHeight: "21px",
  letterSpacing: 0,
  textDecoration: "none",
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const iconStyle: CSSProperties = {
  width: 16,
  height: 16,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

const sizeStyles = {
  md: {
    height: 52,
  },
  sm: {
    height: 40,
  },
} satisfies Record<ButtonSize, CSSProperties>;

const variantStyles = {
  solid: {
    color: "#f8faff",
    background: "#0360ef",
    border: "1px solid #0360ef",
  },
  outline: {
    color: "#0360ef",
    background: "#ffffff",
    border: "1px solid #0360ef",
  },
} satisfies Record<ButtonVariant, CSSProperties>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      leftIcon,
      rightIcon,
      size = "md",
      style,
      type = "button",
      variant = "solid",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        {...props}
        ref={ref}
        className={className}
        disabled={disabled}
        type={type}
        style={{
          ...baseStyle,
          ...sizeStyles[size],
          ...variantStyles[variant],
          opacity: disabled ? 0.4 : undefined,
          cursor: disabled ? "not-allowed" : baseStyle.cursor,
          ...style,
        }}
      >
        {leftIcon ? <span style={iconStyle}>{leftIcon}</span> : null}
        {children}
        {rightIcon ? <span style={iconStyle}>{rightIcon}</span> : null}
      </button>
    );
  },
);

Button.displayName = "Button";

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      children,
      className,
      leftIcon,
      rightIcon,
      size = "md",
      style,
      variant = "solid",
      ...props
    },
    ref,
  ) => {
    return (
      <a
        {...props}
        ref={ref}
        className={className}
        style={{
          ...baseStyle,
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style,
        }}
      >
        {leftIcon ? <span style={iconStyle}>{leftIcon}</span> : null}
        {children}
        {rightIcon ? <span style={iconStyle}>{rightIcon}</span> : null}
      </a>
    );
  },
);

ButtonLink.displayName = "ButtonLink";
