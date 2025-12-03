import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'seach',
  standalone: false,
})
export class SeachPipe implements PipeTransform {

  transform(items: any[], searchText: string): any[] {
    if (!items || !searchText) {
      return items;
    }

    searchText = searchText.toLowerCase();

    return items.filter(record => {
      let searchSource = '';

      // 1. Customer Name (Handles nested object)
      if (record.customer) {
        searchSource += `${record.customer.first_name} ${record.customer.last_name} `;
      } else {
        searchSource += 'n/a ';
      }

      // 2. Sales Agent Name
      searchSource += record.sales_agent_name + ' ';

      // 3. Payment Status (Uses the displayed text: 'paid' or 'not paid')
      searchSource += record.payment_status === 'Completed' ? 'paid ' : 'not paid ';

      // 4. Payment Method (Uses the displayed text: 'Mobile Money' or original value)
      searchSource += record.payment_method === 'MOMO' ? 'mobile money ' : record.payment_method + ' ';

      // Check if the consolidated string contains the search text
      return searchSource.toLowerCase().includes(searchText);
    });
  }

}
