import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';



@Component({
  selector: 'app-search-specific',
  standalone: false,
  templateUrl: './search-specific.html',
  styleUrl: './search-specific.scss',
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
