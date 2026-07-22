import type { ReactElement, SVGProps } from "react";
import {
  SavedArrowCurveLeftDownIcon,
  SavedArrowCurveLeftRightIcon,
  SavedArrowCurveLeftUpIcon,
  SavedArrowCurveRightUpIcon,
  SavedArrowCurveUpLeftIcon,
  SavedArrowDownLeftIcon,
  SavedArrowDownSquareContainedIcon,
  SavedArrowLeftSquareContainedIcon,
  SavedArrowRightSquareContainedIcon,
  SavedArrowUpSquareContainedIcon,
} from "./icons";

export type IconName =
  | "arrow-left"
  | "arrow-right"
  | "book-open"
  | "calendar"
  | "camera"
  | "channel-arrow-right"
  | "channel-home-02"
  | "channel-instagram"
  | "channel-message-typing"
  | "channel-naver-blog"
  | "channel-youtube"
  | "chevron-down"
  | "credit-card"
  | "dots-horizontal"
  | "edit-03"
  | "file-text"
  | "flag"
  | "folder-up-02"
  | "megaphone"
  | "menu-04"
  | "message-typing"
  | "order-option-back"
  | "package"
  | "pen-tool"
  | "pin"
  | "star"
  | "truck"
  | "user-profile-circle"
  | "arrow-curve-left-down"
  | "arrow-curve-left-right"
  | "arrow-curve-left-up"
  | "arrow-down-left"
  | "arrow-curve-up-left"
  | "arrow-curve-right-up"
  | "arrow-left-square-contained"
  | "arrow-right-square-contained"
  | "arrow-up-square-contained"
  | "arrow-down-square-contained"
  | "x-close";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: IconName;
  size?: number;
};
type IconComponentProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number;
};
type IconComponent = (props: IconComponentProps) => ReactElement;

function ArrowLeftIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.11088 3.33333L2.66644 8L7.11088 12.6667M2.66644 8L13.3331 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ArrowRightIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.88889 12.6667L13.3333 8L8.88889 3.33333M13.3333 8L2.66667 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function OrderOptionBackIcon({ size = 18, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={(size * 16) / 18}
      viewBox="0 0 18 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.66667 1L1 8L7.66667 15M1 8L17 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronDownIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BookOpenIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4H10C11.1 4 12 4.9 12 6V20C12 18.9 11.1 18 10 18H5.5C4.67 18 4 17.33 4 16.5V5.5ZM20 5.5C20 4.67 19.33 4 18.5 4H14C12.9 4 12 4.9 12 6V20C12 18.9 12.9 18 14 18H18.5C19.33 18 20 17.33 20 16.5V5.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CalendarIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8 3V6M16 3V6M4 9H20M6 5H18C19.1 5 20 5.9 20 7V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V7C4 5.9 4.9 5 6 5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CameraIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.5 7L10 5H14L15.5 7H18C19.1 7 20 7.9 20 9V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V9C4 7.9 4.9 7 6 7H8.5ZM12 16.5C14.21 16.5 16 14.71 16 12.5C16 10.29 14.21 8.5 12 8.5C9.79 8.5 8 10.29 8 12.5C8 14.71 9.79 16.5 12 16.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CreditCardIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 8H20M6 5H18C19.1 5 20 5.9 20 7V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V7C4 5.9 4.9 5 6 5ZM7.5 15H10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DotsHorizontalIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7 12H7.01M12 12H12.01M17 12H17.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.8"
      />
    </svg>
  );
}

function Edit03Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.8 19.5516H19.8M4.20003 19.5516L8.56602 18.6719C8.79779 18.6252 9.01061 18.511 9.17775 18.3438L18.9514 8.56478C19.42 8.09592 19.4197 7.33593 18.9507 6.86747L16.8803 4.7994C16.4115 4.33113 15.6519 4.33145 15.1835 4.80011L5.40879 14.5802C5.24198 14.7471 5.12808 14.9594 5.08133 15.1907L4.20003 19.5516Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function FileTextIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14 3V8H19M8 13H16M8 17H13M13.5 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V8.5L13.5 3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FlagIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 21V4M6 4H17L15.5 8L17 12H6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FolderUp02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 17V10M12 10L9.5 12.5M12 10L14.5 12.5M3.5 7.5V17.5C3.5 18.6 4.4 19.5 5.5 19.5H18.5C19.6 19.5 20.5 18.6 20.5 17.5V9.5C20.5 8.4 19.6 7.5 18.5 7.5H12.35L10.35 5.5H5.5C4.4 5.5 3.5 6.4 3.5 7.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MegaphoneIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 13V11C4 9.9 4.9 9 6 9H8L17 5V19L8 15H6C4.9 15 4 14.1 4 13ZM8 15L9.5 20H12M17 10L20 8M17 14L20 16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MessageTypingIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.49957 12.0846V12M11.9991 12.0846V12M16.4987 12.0846V12M20.9983 12C20.9983 13.2938 20.7253 14.5238 20.2338 15.6356L21 20.9991L16.4039 19.85C15.1019 20.5823 13.5993 21 11.9991 21C7.02906 21 3 16.9706 3 12C3 7.02944 7.02906 3 11.9991 3C16.9692 3 20.9983 7.02944 20.9983 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChannelArrowRightIcon({
  size = 24,
  ...props
}: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6.97222 10.0833L11.4167 5.41667L6.97222 0.750001M11.4167 5.41667L0.75 5.41667"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        transform="translate(1.91665 2.58335)"
      />
    </svg>
  );
}

function ChannelHome02Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.5 15.0625H14.5M9.30457 1.21117L1.50457 6.48603C1.18802 6.7001 1 7.04666 1 7.41605V17.2882C1 18.2336 1.80589 19 2.8 19H17.2C18.1941 19 19 18.2336 19 17.2882V7.41605C19 7.04665 18.812 6.7001 18.4954 6.48603L10.6954 1.21117C10.2791 0.92961 9.72092 0.929609 9.30457 1.21117Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        transform="translate(2 2)"
      />
    </svg>
  );
}

function ChannelInstagramIcon({
  size = 24,
  ...props
}: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1 15.64H2V3.4H1H0V15.64H1ZM3.4 1V2H17.8V1V0H3.4V1ZM20.2 3.4H19.2V15.64H20.2H21.2V3.4H20.2ZM20.2 15.64H19.2C19.2 16.4132 18.5732 17.04 17.8 17.04V18.04V19.04C19.6778 19.04 21.2 17.5178 21.2 15.64H20.2ZM17.8 1V2C18.5732 2 19.2 2.6268 19.2 3.4H20.2H21.2C21.2 1.52223 19.6778 0 17.8 0V1ZM1 3.4H2C2 2.6268 2.6268 2 3.4 2V1V0C1.52223 0 0 1.52223 0 3.4H1ZM3.4 18.04V17.04C2.6268 17.04 2 16.4132 2 15.64H1H0C0 17.5178 1.52223 19.04 3.4 19.04V18.04ZM14.2 9.52012H13.2C13.2 10.9561 12.0359 12.1201 10.6 12.1201V13.1201V14.1201C13.1405 14.1201 15.2 12.0606 15.2 9.52012H14.2ZM10.6 13.1201V12.1201C9.16406 12.1201 8 10.9561 8 9.52012H7H6C6 12.0606 8.05949 14.1201 10.6 14.1201V13.1201ZM7 9.52012H8C8 8.08418 9.16406 6.92012 10.6 6.92012V5.92012V4.92012C8.05949 4.92012 6 6.97961 6 9.52012H7ZM10.6 5.92012V6.92012C12.0359 6.92012 13.2 8.08418 13.2 9.52012H14.2H15.2C15.2 6.97961 13.1405 4.92012 10.6 4.92012V5.92012ZM17.8 18.04V17.04H3.4V18.04V19.04H17.8V18.04Z"
        fill="currentColor"
        transform="translate(1.4 2.48)"
      />
    </svg>
  );
}

function ChannelMessageTypingIcon({
  size = 24,
  ...props
}: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.49957 10.0846V10M9.99915 10.0846V10M14.4987 10.0846V10M18.9983 10C18.9983 11.2938 18.7253 12.5238 18.2338 13.6356L19 18.9991L14.4039 17.85C13.1019 18.5823 11.5993 19 9.99915 19C5.02906 19 1 14.9706 1 10C1 5.02944 5.02906 1 9.99915 1C14.9692 1 18.9983 5.02944 18.9983 10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        transform="translate(2 2)"
      />
    </svg>
  );
}

function ChannelNaverBlogIcon({
  size = 24,
  ...props
}: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1 9V17H9.1C11.2539 17 13 15.2091 13 13C13 10.7909 11.2539 9 9.1 9H1ZM1 9H7.9C10.0539 9 11.8 7.20914 11.8 5C11.8 2.79086 10.0539 1 7.9 1H1V9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        transform="translate(5 3)"
      />
    </svg>
  );
}

function ChannelYoutubeIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        height="12"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        width="18"
        x="3"
        y="6"
      />
      <path d="M10 9.5L15 12L10 14.5V9.5Z" fill="currentColor" />
    </svg>
  );
}

function Menu04Icon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.5 18H4M20 12H4M20 6H4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PackageIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3ZM4.5 8L12 12.25L19.5 8M12 12.25V20.5M8 5.5L16 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PenToolIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 3L19 10L14 21H10L5 10L12 3ZM12 3V10M12 10L10 12M12 10L14 12M9 17H15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function StarIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 3.5L14.6 8.8L20.5 9.65L16.25 13.8L17.25 19.65L12 16.9L6.75 19.65L7.75 13.8L3.5 9.65L9.4 8.8L12 3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TruckIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3 6H14V16H3V6ZM14 9H18L21 12.5V16H14V9ZM7 19C8.1 19 9 18.1 9 17C9 15.9 8.1 15 7 15C5.9 15 5 15.9 5 17C5 18.1 5.9 19 7 19ZM17 19C18.1 19 19 18.1 19 17C19 15.9 18.1 15 17 15C15.9 15 15 15.9 15 17C15 18.1 15.9 19 17 19Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UserProfileCircleIcon({
  size = 24,
  ...props
}: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21ZM12 12.5C13.66 12.5 15 11.16 15 9.5C15 7.84 13.66 6.5 12 6.5C10.34 6.5 9 7.84 9 9.5C9 11.16 10.34 12.5 12 12.5ZM7.5 18C8.35 16.2 10.02 15 12 15C13.98 15 15.65 16.2 16.5 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PinIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 12 12"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="m7.85 1.5 2.65 2.65-1.7.57-1.65 1.65.25 1.8-.72.72-1.78-1.8-2.68 2.68-.7-.7L4.2 6.39 2.4 4.61l.72-.72 1.8.25 1.65-1.65.58-1.7.7.71Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XCloseIcon({ size = 24, ...props }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16 8L8 16M16 16L8 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

const icons = {
  "arrow-left": ArrowLeftIcon,
  "arrow-right": ArrowRightIcon,
  "book-open": BookOpenIcon,
  calendar: CalendarIcon,
  camera: CameraIcon,
  "channel-arrow-right": ChannelArrowRightIcon,
  "channel-home-02": ChannelHome02Icon,
  "channel-instagram": ChannelInstagramIcon,
  "channel-message-typing": ChannelMessageTypingIcon,
  "channel-naver-blog": ChannelNaverBlogIcon,
  "channel-youtube": ChannelYoutubeIcon,
  "chevron-down": ChevronDownIcon,
  "credit-card": CreditCardIcon,
  "dots-horizontal": DotsHorizontalIcon,
  "edit-03": Edit03Icon,
  "file-text": FileTextIcon,
  flag: FlagIcon,
  "folder-up-02": FolderUp02Icon,
  megaphone: MegaphoneIcon,
  "menu-04": Menu04Icon,
  "message-typing": MessageTypingIcon,
  "order-option-back": OrderOptionBackIcon,
  package: PackageIcon,
  "pen-tool": PenToolIcon,
  pin: PinIcon,
  star: StarIcon,
  truck: TruckIcon,
  "user-profile-circle": UserProfileCircleIcon,
  "arrow-curve-left-down": SavedArrowCurveLeftDownIcon,
  "arrow-curve-left-right": SavedArrowCurveLeftRightIcon,
  "arrow-curve-left-up": SavedArrowCurveLeftUpIcon,
  "arrow-down-left": SavedArrowDownLeftIcon,
  "arrow-curve-up-left": SavedArrowCurveUpLeftIcon,
  "arrow-curve-right-up": SavedArrowCurveRightUpIcon,
  "arrow-left-square-contained": SavedArrowLeftSquareContainedIcon,
  "arrow-right-square-contained": SavedArrowRightSquareContainedIcon,
  "arrow-up-square-contained": SavedArrowUpSquareContainedIcon,
  "arrow-down-square-contained": SavedArrowDownSquareContainedIcon,
  "x-close": XCloseIcon,
} satisfies Record<IconName, IconComponent>;

export function Icon({ name, size = 24, ...props }: IconProps) {
  const IconComponent = icons[name];

  return (
    <IconComponent
      aria-hidden="true"
      focusable="false"
      size={size}
      {...props}
    />
  );
}
