import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: Date | string | number): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat('pl', { numeric: 'auto' });

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(0, 'second');
    }

    const MINUTE = 60;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    const WEEK = DAY * 7;
    const MONTH = DAY * 30;
    const YEAR = DAY * 365;

    const cutoffs = [
      { unit: 'year', value: YEAR },
      { unit: 'month', value: MONTH },
      { unit: 'week', value: WEEK },
      { unit: 'day', value: DAY },
      { unit: 'hour', value: HOUR },
      { unit: 'minute', value: MINUTE },
    ] as const;

    for (const { unit, value: cutoffValue } of cutoffs) {
      if (Math.abs(diffInSeconds) >= cutoffValue) {
        const val = Math.round(diffInSeconds / cutoffValue);
        return rtf.format(val, unit);
      }
    }

    return rtf.format(Math.round(diffInSeconds), 'second');
  }
}
