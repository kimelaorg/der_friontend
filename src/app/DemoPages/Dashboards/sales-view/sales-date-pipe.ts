import { Pipe, PipeTransform, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SaleRecord } from './sales-data';


export interface SaleGroup {
  group: string; // The name of the group (e.g., "Today", "2nd Week", "January 2025")
  data: SaleRecord[]; // The list of sales belonging to this group
}

export type GroupType = 'daily' | 'weekly' | 'monthly';


@Pipe({
  name: 'salesDate',
  standalone: false,
})

export class SalesDatePipe implements PipeTransform {

    // Inject DatePipe for formatting, using the inject function for standalone
    private datePipe = inject(DatePipe);

    transform(
        salesRecords: any[] | null | undefined,
        type: GroupType
    ): SaleGroup[] {
        if (!salesRecords || salesRecords.length === 0) {
            return [];
        }

        const groupedMap = new Map<string, SaleRecord[]>();
        const today = new Date();

        // --- 1. Map Sales Records to Group Keys ---
        salesRecords.forEach(sale => {
            const saleDate = new Date(sale.sale_date);
            let groupKey: string;

            switch (type) {
                case 'daily':
                    groupKey = this.getDailyGroupKey(saleDate, today);
                    break;
                case 'weekly':
                    groupKey = this.getWeeklyGroupKey(saleDate);
                    break;
                case 'monthly':
                    groupKey = this.getMonthlyGroupKey(saleDate);
                    break;
                default:
                    groupKey = 'Ungrouped';
            }

            if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, []);
            }
            groupedMap.get(groupKey)!.push(sale);
        });

        // --- 2. Convert Map to Array and Sort ---
        return this.sortAndFormatGroups(groupedMap, type);
    }

    // --- Helper Functions for Grouping Logic ---

    /**
     * **DAILY Grouping:** Groups sales by Today, Yesterday, Day Before Yesterday, or Day/Date.
     */
    private getDailyGroupKey(poDate: Date, today: Date): string {
        // Normalize dates to start of day for accurate comparison
        const poDayStart = new Date(poDate.getFullYear(), poDate.getMonth(), poDate.getDate());
        const todayDayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Calculate the difference in days
        const msPerDay = 1000 * 60 * 60 * 24;
        const diffDays = Math.round((todayDayStart.getTime() - poDayStart.getTime()) / msPerDay);

        if (diffDays === 0) {
            return "Today";
        } else if (diffDays === 1) {
            return "Yesterday";
        } else if (diffDays === 2) {
            return "Day Before Yesterday";
        } else {
            // Default to Day Name and Date format: 'EEEE dd.MM.yyyy'
            return this.datePipe.transform(poDate, 'EEEE dd.MM.yyyy') || 'Other Day';
        }
    }

    /**
     * **WEEKLY Grouping:** Groups sales by 1st Week, 2nd Week, 3rd Week, or 4th Week of the month.
     */
    private getWeeklyGroupKey(poDate: Date): string {
        const dateOfMonth = poDate.getDate();
        let weekOfMonth = Math.ceil(dateOfMonth / 7);

        if (weekOfMonth > 4) { weekOfMonth = 4; } // Cap at 4th week

        // Determine the suffix (st, nd, rd, th)
        const suffix = (weekOfMonth === 1) ? 'st' : (weekOfMonth === 2) ? 'nd' : (weekOfMonth === 3) ? 'rd' : 'th';

        // Include month and year for unique grouping across different months
        const monthYear = this.datePipe.transform(poDate, 'MMMM yyyy');

        return `${weekOfMonth}${suffix} Week (${monthYear})`;
    }

    /**
     * **MONTHLY Grouping:** Groups sales by Month Name and Year (e.g., January 2025).
     */
    private getMonthlyGroupKey(poDate: Date): string {
        // Format: 'MMMM yyyy' -> 'January 2025'
        return this.datePipe.transform(poDate, 'MMMM yyyy') || 'Other Month';
    }

    // --- Helper Function for Sorting ---

    /**
     * Converts the map to SaleGroup array and applies custom sorting based on type.
     */
    private sortAndFormatGroups(groupedMap: Map<string, SaleRecord[]>, type: GroupType): SaleGroup[] {
        const groupedArray: SaleGroup[] = [];
        const keys = Array.from(groupedMap.keys());

        if (type === 'daily') {
            const customOrder = ["Today", "Yesterday", "Day Before Yesterday"];
            keys.sort((a, b) => {
                const indexA = customOrder.indexOf(a);
                const indexB = customOrder.indexOf(b);

                // Prioritize Today, Yesterday, Day Before Yesterday
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;

                // For regular dates, sort reverse chronologically based on the date part (dd.MM.yyyy)
                const dateA = new Date(a.substring(a.lastIndexOf(' ') + 1));
                const dateB = new Date(b.substring(b.lastIndexOf(' ') + 1));
                return dateB.getTime() - dateA.getTime();
            });
        }
        else if (type === 'monthly') {
            // Sort Monthly: Reverse chronological (most recent month first)
            keys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        }
        else if (type === 'weekly') {
            keys.sort((a, b) => {
                // Extracts the Month/Year date from the group key (e.g., "1st Week (January 2025)")
                const getDate = (key: string) => new Date(key.substring(key.indexOf('(') + 1, key.lastIndexOf(')')));
                // Extracts the week number
                const getWeekNum = (key: string) => parseInt(key.match(/\d+/)?.[0] || '1');

                const dateA = getDate(a);
                const dateB = getDate(b);

                // 1. Sort by Month/Year (Reverse Chronological)
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateB.getTime() - dateA.getTime();
                }

                // 2. Sort by Week Number (Ascending)
                return getWeekNum(a) - getWeekNum(b);
            });
        }

        // Build the final array structure
        keys.forEach(key => {
            groupedArray.push({ group: key, data: groupedMap.get(key) || [] });
        });

        return groupedArray;
    }

}
