// listing.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BaseProductList } from './base';

@Component({
  selector: 'app-listing',
  standalone: false,
  templateUrl: './listing.html',
  styleUrl: './listing.scss',
})
export class Listing extends BaseProductList implements OnInit {

    private route = inject(ActivatedRoute);

    currentCategory: string | null = null;

    get categoryDisplayName(): string {
        return this.currentCategory ? this.currentCategory.replace('-', ' ') : 'All Products';
    }

    ngOnInit(): void {
        // 1. UI Initialization (inherited)
        this.mainNavLinks = this.navLinks.filter(
            link => link.label !== 'Sign in' && link.label !== 'Cart'
        );
        this.mobileNavLinks = this.navLinks;
        this.startSlideshow();

        // 2. Read Category from URL and Fetch Data
        // Subscribe to route changes to handle navigation between categories (e.g., Motherboards -> Screens)
        this.route.url.subscribe(segments => {
            const newCategory = segments[0]?.path || null;

            // Only reload if the category actually changed
            if (newCategory !== this.currentCategory) {
                this.currentCategory = newCategory;

                // CRITICAL: Reset state and set the new category URL (uses the new base method)
                this.resetAndSetCategoryUrl(this.currentCategory);

                // Now, call the inherited loadNextPage() to fetch the FIRST page of the filtered data
                this.loadNextPage();
            }
        });
    }

    goToProductDetails(productId: string | number): void {
      // Navigate to /product/123, /product/abc, etc.
      this.router.navigate(['/value', productId]);
    }

    // NOTE: All other functions (loadNextPage, onScroll, slideshow functions)
    // are INHERITED from BaseProductList!
}
