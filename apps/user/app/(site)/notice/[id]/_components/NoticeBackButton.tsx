"use client";

import { useRouter } from "next/navigation";

type NoticeBackButtonProps = {
  className?: string;
  fallbackHref: string;
  restoreListHistory: boolean;
};

export function NoticeBackButton({
  className,
  fallbackHref,
  restoreListHistory,
}: NoticeBackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (restoreListHistory && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button className={className} onClick={handleClick} type="button">
      목록으로
    </button>
  );
}
