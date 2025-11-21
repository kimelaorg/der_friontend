import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'day',
  standalone: false,
})
export class DayPipe implements PipeTransform {

  private getMidnightDate(date: Date): number {
    // We use a new Date object to avoid mutating the input
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Sets the time to midnight in the local timezone (EAT)
    return d.getTime();
  }

  /**
   * Helper: Formats the date as DD.MM.YYYY
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Transforms the API's date string into a relative display string.
   * @param value The sale_date string from the API (e.g., "2025-11-20T12:14:32.548Z").
   */
  transform(value: string | Date | number): string {
    if (!value) {
      return '';
    }

    // 1. Normalize the API string into a local Date object
    const inputDate = new Date(value);

    // 2. Define the key comparison points (Today, Yesterday, etc.) based on local time
    const todayMidnight = this.getMidnightDate(new Date());
    const inputMidnight = this.getMidnightDate(inputDate);

    // Calculate the difference in days. We use the time difference divided by milliseconds in a day.
    // This is reliable because both dates were normalized to midnight in the same local timezone (EAT).
    const msPerDay = 86400000;
    const diffDays = Math.round((todayMidnight - inputMidnight) / msPerDay);

    // 3. Apply the display logic
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays === 2) {
      return 'Day Before Yesterday';
    } else if (diffDays > 2) {
      // 4. For older dates, return the specific formatted date
      return this.formatDate(inputDate);
    } else {
      // Optional: Handle future dates or invalid scenarios gracefully
      return this.formatDate(inputDate);
    }
  }
}
