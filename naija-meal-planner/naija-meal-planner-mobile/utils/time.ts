// export function formatRelativeTime(value?: string) {
//   if (!value) return "";

//   const raw = String(value).trim();

//   const match = raw.match(
//     /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/
//   );

//   let date: Date;

//   if (match) {
//     const [, y, m, d, h, min, s] = match;
//     date = new Date(
//       Date.UTC(
//         Number(y),
//         Number(m) - 1,
//         Number(d),
//         Number(h),
//         Number(min),
//         Number(s)
//       )
//     );
//   } else {
//     date = new Date(raw);
//   }

//   if (Number.isNaN(date.getTime())) return raw;

//   const now = new Date();
//   const diffMs = now.getTime() - date.getTime();

//   if (diffMs < 0) return "Just now";

//   const diffMinutes = Math.floor(diffMs / 60000);
//   const diffHours = Math.floor(diffMinutes / 60);
//   const diffDays = Math.floor(diffHours / 24);

//   if (diffMinutes < 1) return "Just now";
//   if (diffMinutes < 60) return `${diffMinutes}m ago`;
//   if (diffHours < 24) return `${diffHours}h ago`;
//   if (diffDays === 1) return "Yesterday";
//   if (diffDays < 7) return `${diffDays}d ago`;

//   return date.toLocaleDateString(undefined, {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   });
// }
export function formatAgeSeconds(seconds?: number) {
  const s = Number(seconds || 0);

  const minutes = Math.floor(s / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return "";
}