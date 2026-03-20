import { DateTime } from "luxon";

export const getUTCRange = (date: string, timezone: string) => {
  const start = DateTime.fromISO(date, { zone: timezone })
    .startOf("day")
    .toUTC();

  const end = DateTime.fromISO(date, { zone: timezone }).endOf("day").toUTC();

  return {
    utcStart: start.toJSDate(),
    utcEnd: end.toJSDate(),
  };
};


export const convertToUTCDate = (date: Date) => {
  return DateTime.fromJSDate(date).toUTC().toJSDate();
}