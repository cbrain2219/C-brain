const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

export function formatPublishedDate(publishedAt: string) {
  return dateFormatter.format(new Date(publishedAt)).replace(/\.$/, "");
}
