import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PurchaseOrder, OrderGroup } from './purchasing-data';

// --- Define the necessary interfaces for strong typing ---
// Assuming PurchaseOrder is defined elsewhere, but we need the date property

@Pipe({
    name: 'group',
    // IMPORTANT: Pipes must be declared standalone or provided in a module
    standalone: false,
})
export class GroupPipe implements PipeTransform {

    // Inject DatePipe into the constructor to use its formatting logic
    constructor(private datePipe: DatePipe) {}

    transform(purchaseOrders: PurchaseOrder[] | null | undefined): OrderGroup[] {
        if (!purchaseOrders || purchaseOrders.length === 0) {
            return [];
        }

        const today = new Date();
        // Use Map for efficient, ordered grouping before converting to the final array
        const groupedMap = new Map<string, PurchaseOrder[]>();

        purchaseOrders.forEach(po => {
            // Ensure po_date is treated as a Date object for comparison
            const poDate = new Date(po.po_date);
            let groupKey: string;

            // --- 1. Determine the Group Key ---

            // Current Month check
            if (poDate.getFullYear() === today.getFullYear() && poDate.getMonth() === today.getMonth()) {
                groupKey = "Current Month";
            }
            // Last Month check
            else {
                // Calculate the date for the start of last month for accurate comparison
                const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

                if (poDate.getFullYear() === lastMonthDate.getFullYear() && poDate.getMonth() === lastMonthDate.getMonth()) {
                    groupKey = "Last Month";
                }
                // Default to MMMM YYYY
                else {
                    // Use DatePipe to format the month name and year
                    groupKey = this.datePipe.transform(poDate, 'MMMM yyyy') || 'Other';
                }
            }

            // Group the order
            if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, []);
            }
            groupedMap.get(groupKey)!.push(po);
        });

        // --- 2. Convert Map to Array for Template Iteration ---

        const groupedArray: OrderGroup[] = [];

        // Custom sorting to ensure "Current Month" and "Last Month" appear first
        const sortedKeys = Array.from(groupedMap.keys()).sort((a, b) => {
            // Prioritize Current Month
            if (a === "Current Month") return -1;
            if (b === "Current Month") return 1;
            // Prioritize Last Month (after Current Month)
            if (a === "Last Month") return -1;
            if (b === "Last Month") return 1;

            // For general months, use a simple date comparison for descending order
            // Note: This relies on the group key being "MMMM YYYY"
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateB.getTime() - dateA.getTime();
        });

        // Build the final array structure
        sortedKeys.forEach(key => {
            groupedArray.push({
                group: key,
                data: groupedMap.get(key) || []
            });
        });

        return groupedArray;
    }

}
