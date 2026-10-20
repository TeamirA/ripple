const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const monthYearFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

const COMPACT_UNITS = [
  { suffix: 'd', seconds: 86400 },
  { suffix: 'h', seconds: 3600 },
  { suffix: 'm', seconds: 60 },
];

/** "now", "5m", "3h", "2d" for the last week, then "Oct 12" or "Oct 12, 2025". */
export function formatRelativeTime(value, now = Date.now()) {
  const date = new Date(value);
  const elapsedSeconds = Math.round((now - date.getTime()) / 1000);

  if (elapsedSeconds < 60) return 'now';
  if (elapsedSeconds < 7 * 86400) {
    const { suffix, seconds } = COMPACT_UNITS.find((unit) => elapsedSeconds >= unit.seconds);
    return `${Math.floor(elapsedSeconds / seconds)}${suffix}`;
  }
  const isSameYear = date.getFullYear() === new Date(now).getFullYear();
  return (isSameYear ? shortDateFormatter : fullDateFormatter).format(date);
}

export function formatDateTime(value) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatJoinDate(value) {
  return `Joined ${monthYearFormatter.format(new Date(value))}`;
}

const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCount(value) {
  return compactNumberFormatter.format(value);
}
