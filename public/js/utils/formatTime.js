const relativeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
  style: 'short',
});
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

const UNITS = [
  { unit: 'minute', seconds: 60 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'day', seconds: 86400 },
];

/** "now", "5m", "3h", "2d" for recent dates, then "Oct 12" or "Oct 12, 2025". */
export function formatRelativeTime(value, now = Date.now()) {
  const date = new Date(value);
  const elapsedSeconds = Math.round((now - date.getTime()) / 1000);

  if (elapsedSeconds < 45) return 'now';
  if (elapsedSeconds < 7 * 86400) {
    const { unit, seconds } = [...UNITS].reverse().find((entry) => elapsedSeconds >= entry.seconds);
    return relativeFormatter.format(-Math.floor(elapsedSeconds / seconds), unit);
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
