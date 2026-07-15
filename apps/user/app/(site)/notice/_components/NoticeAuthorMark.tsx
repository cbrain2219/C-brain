type NoticeAuthorMarkProps = {
  className?: string;
  iconClassName?: string;
};

export function NoticeAuthorMark({
  className,
  iconClassName,
}: NoticeAuthorMarkProps) {
  return (
    <span aria-hidden="true" className={className}>
      <svg
        className={iconClassName}
        fill="none"
        viewBox="0 0 3 12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 10.6072C3 11.0621 2.87561 11.4123 2.62683 11.6458C2.37805 11.8833 2.00488 12 1.50366 12C0.50122 12 0 11.5411 0 10.6193V1.37672C0 0.458906 0.50122 0 1.50366 0C1.9939 0 2.36707 0.112714 2.61951 0.342167C2.87195 0.567595 3 0.913787 3 1.36867V4.77424H1.82927V1.28011C1.82927 1.13116 1.80366 1.02248 1.7561 0.954042C1.70854 0.885609 1.62439 0.853405 1.50366 0.853405C1.3939 0.853405 1.30976 0.881583 1.25488 0.941966C1.2 1.00235 1.17073 1.11506 1.17073 1.28011V10.6474C1.17073 10.8044 1.19634 10.9131 1.24756 10.9856C1.29878 11.054 1.38293 11.0862 1.50366 11.0862C1.62439 11.0862 1.70854 11.054 1.7561 10.9896C1.80366 10.9252 1.82927 10.8125 1.82927 10.6474V6.50922H3V10.6112V10.6072Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
