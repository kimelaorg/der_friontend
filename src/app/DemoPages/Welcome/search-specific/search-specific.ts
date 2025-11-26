import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

// @Component({
//   selector: 'app-search-specific',
//   standalone: false,
//   templateUrl: './search-specific.html',
//   styleUrl: './search-specific.scss',
// })
// export class SearchSpecific {
//
// }



@Component({
  selector: 'app-search-specific',
  standalone: false,
  // imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/der/product', productId]"
      (click)="onClick()"
      class="search-item-link"
    >
      <!-- Content projected here -->
      <ng-content></ng-content>
    </a>
  `,
  styles: [`
    /* Replicate the styling from search-product.ts for consistency */
    .search-item-link {
      color: #333;
      text-decoration: none;
      font-weight: 400;
      padding: 8px 20px;
      border-radius: 4px;
      transition: background-color 0.2s, color 0.2s;
      display: flex;
      align-items: center;
    }

    .search-item-link:hover {
      background-color: #f0f8ff;
      color: #0073e6;
    }
  `]
})
export class SearchSpecific {
  // Input: The ID of the product to navigate to
  @Input({ required: true }) productId!: number;

  // Output: Event emitter to notify the parent component (search) to close
  @Output() closeSearch = new EventEmitter<void>();

  onClick(): void {
    // 1. Emit the event to the parent
    this.closeSearch.emit();
    // 2. Navigation is handled automatically by RouterLink
  }
}
