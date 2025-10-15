import { DateRangeParams } from "../api/types";

const START_TIME_SUFFIX = "T00:00:00Z";
const END_TIME_SUFFIX = "T23:59:59Z";

export function toDateRangeParams(start: string, end: string): DateRangeParams {
  const params: DateRangeParams = {};
  if (start) {
    const iso = new Date(`${start}${START_TIME_SUFFIX}`).toISOString();
    params.start_date = iso;
  }
  if (end) {
    const iso = new Date(`${end}${END_TIME_SUFFIX}`).toISOString();
    params.end_date = iso;
  }
  return params;
}
