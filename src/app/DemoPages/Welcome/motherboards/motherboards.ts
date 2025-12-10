import { Component, signal, OnInit, inject, HostListener, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from "@angular/common/http";
import { finalize } from 'rxjs/operators';
// CRITICAL UPDATE: Import the necessary, corrected interface names
import {
    NavLink,
    Slide,
    IProductSpecification, // The new item type
    IPaginatedSpecificationList // The new paginated wrapper type
} from "../home/data";

@Component({
  selector: 'app-motherboards',
  standalone: false,
  templateUrl: './motherboards.html',
  styleUrl: './motherboards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Motherboards implements OnInit, OnDestroy {

  currentYear: number = new Date().getFullYear();
  private slideInterval: any;
 
  private initialUrl = 'http://127.0.0.1:8000/api/products/public-catalog/';
 
  // --- INFINITE SCROLLING STATE ---
  nextPageUrl: string | null = this.initialUrl; // URL for the next page to fetch
  private loadedIds = new Set<number>(); // Set to track IDs and prevent NG0955 duplicates
 
  // Flag to prevent multiple concurrent requests while scrolling
  isLoading = signal(false);
 
  // Holds the accumulated product specifications
  products: IProductSpecification[] = [];
 
  http = inject(HttpClient);
  private router = inject(Router);

  readonly navLinks: NavLink[] = [
    { label: 'TV Screens', link: '/der/screens' },
    { label: 'Motherboards', link: '/der/motherboards' },
    { label: 'T-Con', link: '/der/t-con' },
    { label: 'Accessories', link: '/der/accessories' },
    { label: 'Software', link: '/der/software' },
    { label: 'Deals', link: '/der/deals' },
    { label: 'Support', link: '/support' },
    { label: 'Sign in', link: '/der/account/login' },
    { label: 'Cart', link: '/cart' },
  ];

  mainNavLinks: NavLink[] = [];
  mobileNavLinks: NavLink[] = [];
  isMobileMenuOpen = signal(false);

  slides = signal<Slide[]>([
    { title: 'The Future of Sound', subtitle: 'New Audio Series - Up to 40% Off.', cta: 'Shop Now', link: '/sale/audio', imgClass: 'slide-1' },
    { title: 'Big Screen, Bigger Deals', subtitle: '4K QLED TVs starting at $499.', cta: 'Explore TVs', link: '/shop/tvs', imgClass: 'slide-2' },
    { title: 'Smart Home Essentials', subtitle: 'Control your life with our automation kits.', cta: 'See Kits', link: '/shop/smarthome', imgClass: 'slide-3' },
  ]);
  currentSlide = signal(0);

  
  ngOnInit() {
    this.mainNavLinks = this.navLinks.filter(
        link => link.label !== 'Sign in' && link.label !== 'Cart'
    );
    this.mobileNavLinks = this.navLinks;
    this.startSlideshow();

    // --- CRITICAL FIX: Only call loadNextPage() for the initial fetch ---
    this.loadNextPage();
    // Removed the redundant and confusing this.loadAll() call.
  }

  ngOnDestroy() {
    if (this.slideInterval) {
        clearInterval(this.slideInterval);
    }
  }

    // Removed the redundant loadAll() function. loadNextPage handles all fetching.
    /*
    loadAll(): void {
        this.http.get<IPaginatedSpecificationList>(`${this.url}`).subscribe(res => {
            this.products = res.results;
        });
    }
    */

  loadNextPage(): void {
      if (this.isLoading() || !this.nextPageUrl) {
          return;
      }

      this.isLoading.set(true);

      this.http.get<IPaginatedSpecificationList>(this.nextPageUrl)
          .pipe(
              finalize(() => this.isLoading.set(false))
          )
          .subscribe(res => {
              const incomingResults = res.results;
              const newProducts: IProductSpecification[] = [];

              // 1. Filter the incoming results for duplicates (fixes NG0955)
              for (const item of incomingResults) {
                  if (!this.loadedIds.has(item.id)) {
                      newProducts.push(item);
                      // 2. Add the new, unique ID to the Set
                      this.loadedIds.add(item.id);
                  }
              }

              // 3. Append only the unique new products
              this.products = [...this.products, ...newProducts];

              // 4. Update the URL for the next fetch
              this.nextPageUrl = res.next;
          });
  }

  toggleMenu(): void {
    this.isMobileMenuOpen.update(current => !current);
  }

  @HostListener('window:resize')
  onResize(): void {
    const lgBreakpoint = 1024;
    if (window.innerWidth >= lgBreakpoint && this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  @HostListener('window:scroll', [])
    onScroll(): void {
        // Threshold: How close the user must be to the bottom (e.g., 500 pixels)
        const SCROLL_THRESHOLD = 500;

        // Check if the user has scrolled to near the bottom of the page
        const currentScrollPosition = window.scrollY + window.innerHeight;
        const totalDocumentHeight = document.documentElement.scrollHeight;

        if (currentScrollPosition >= totalDocumentHeight - SCROLL_THRESHOLD) {
            this.loadNextPage();
        }
    }

  startSlideshow(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  resetSlideshowTimer(): void {
    clearInterval(this.slideInterval);
    this.startSlideshow();
  }

  nextSlide(): void {
    this.currentSlide.update(current =>
      (current + 1) % this.slides().length
    );
    this.resetSlideshowTimer();
  }

  prevSlide(): void {
    this.currentSlide.update(current =>
      (current - 1 + this.slides().length) % this.slides().length
    );
    this.resetSlideshowTimer();
  }

  setCurrentSlide(index: number): void {
    this.currentSlide.set(index);
    this.resetSlideshowTimer();
  }
}
