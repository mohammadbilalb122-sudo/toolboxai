/**
 * Local-calendar date helpers.
 *
 * `<input type="date">` yields "YYYY-MM-DD". Passing that to `new Date()`
 * parses it as UTC midnight, but reading it back with getFullYear/getDate
 * interprets it in local time, which shifts the date by a day for anyone west
 * of UTC. These helpers keep every value on the same local calendar so a
 * birthday lands on the birthday.
 *
 * The Date Difference tool deliberately uses UTC instead, which is right for
 * counting whole days between two dates without DST drift; it is left alone.
 */

export type CalendarAge = {
  years: number;
  months: number;
  days: number;
  totalDays: number;
};

/** Local calendar date as "YYYY-MM-DD" for `<input type="date">`. */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses "YYYY-MM-DD" as local midnight, rejecting dates that do not exist. */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // Rejects overflow such as 2023-02-30, which Date would roll forward.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Strips the time of day so comparisons fall on calendar boundaries. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Adds months, clamping to the last day of the target month. */
export function addCalendarMonths(date: Date, monthCount: number): Date {
  const day = date.getDate();
  const shifted = new Date(date.getFullYear(), date.getMonth() + monthCount, 1);
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  return new Date(shifted.getFullYear(), shifted.getMonth(), Math.min(day, lastDay));
}

/** Whole calendar days between two local midnights, immune to DST shifts. */
export function calendarDaysBetween(from: Date, to: Date): number {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/**
 * Elapsed years/months/days from `birth` to `today`.
 *
 * Works forward by repeatedly adding whole months and stepping back when the
 * anchor overshoots, so month ends clamp (Jan 31 + 1 month is Feb 28/29)
 * instead of overflowing into the following month.
 */
export function calculateCalendarAge(birth: Date, today: Date): CalendarAge {
  const end = startOfLocalDay(today);

  let years = end.getFullYear() - birth.getFullYear();
  let anchor = addCalendarMonths(birth, years * 12);
  if (anchor.getTime() > end.getTime()) {
    years -= 1;
    anchor = addCalendarMonths(birth, years * 12);
  }

  let months =
    (end.getFullYear() - anchor.getFullYear()) * 12 + end.getMonth() - anchor.getMonth();
  let monthAnchor = addCalendarMonths(anchor, months);
  if (monthAnchor.getTime() > end.getTime()) {
    months -= 1;
    monthAnchor = addCalendarMonths(anchor, months);
  }

  return {
    years,
    months,
    days: calendarDaysBetween(monthAnchor, end),
    totalDays: calendarDaysBetween(birth, end),
  };
}
