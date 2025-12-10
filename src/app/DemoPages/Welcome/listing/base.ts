import {
    Directive,
    signal,
    inject,
    HostListener,
    OnDestroy
} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { IProductSpecification, IPaginatedSpecificationList, Slide, NavLink } from "../home/data";

@Directive()
export abstract class BaseProductList implements OnDestroy {

    protected http = inject(HttpClient);
    protected router = inject(Router);

    private slideInterval: any;
    currentYear: number = new Date().getFullYear();

    // Base URL for the entire catalog API
    protected initialUrl = 'http://127.0.0.1:8000/api/products/public-catalog/';

    // INFINITE SCROLLING STATE
    nextPageUrl: string | null = this.initialUrl;
    protected loadedIds = new Set<number>();
    isLoading = signal(false);
    products: IProductSpecification[] = [];

    // UI/NAV STATE
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

    // SLIDESHOW STATE
    slides = signal<Slide[]>([
        { title: 'The Future of Sound', subtitle: 'New Audio Series - Up to 40% Off.', cta: 'Shop Now', link: '/sale/audio', imgClass: 'slide-1' },
        { title: 'Big Screen, Bigger Deals', subtitle: '4K QLED TVs starting at $499.', cta: 'Explore TVs', link: '/shop/tvs', imgClass: 'slide-2' },
        { title: 'Smart Home Essentials', subtitle: 'Control your life with our automation kits.', cta: 'See Kits', link: '/shop/smarthome', imgClass: 'slide-3' },
    ]);
    currentSlide = signal(0);

    // --- LIFECYCLE & CLEANUP ---
    ngOnDestroy() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
        }
    }

    // CRITICAL NEW METHOD: Resets state and sets the URL for the first fetch (filtered or general)
    protected resetAndSetCategoryUrl(categoryPath: string | null): void {
        // 1. Clear existing data and state (CRITICAL for infinite scrolling)
        this.products = [];
        this.loadedIds.clear();
        this.isLoading.set(false);

        let url = this.initialUrl;


        // 2. Modify the URL to include a query parameter for filtering
        if (categoryPath && categoryPath !== 'home' && categoryPath !== 'der') {
            const slugValue = categoryPath.toLowerCase();
            // NOTE: Assuming your Django/DRF backend filter is named 'category_slug'
            url = `${this.initialUrl}?category_slug=${slugValue}`;
        }

        // 3. Set the new URL for the next fetch
        this.nextPageUrl = url;
    }

    // The core fetching logic (UNMODIFIED, as it now relies on nextPageUrl being set correctly)
    loadNextPage(): void {
        if (this.isLoading() || !this.nextPageUrl) {
            return;
        }

        this.isLoading.set(true);

        this.http.get<IPaginatedSpecificationList>(this.nextPageUrl)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(res => {
                const incomingResults = res.results;
                const newProducts: IProductSpecification[] = [];

                for (const item of incomingResults) {
                    if (!this.loadedIds.has(item.id)) {
                        newProducts.push(item);
                        this.loadedIds.add(item.id);
                    }
                }

                this.products = [...this.products, ...newProducts];
                this.nextPageUrl = res.next;
            });
    }

    // ... (All other inherited methods like onScroll, slideshow controls remain the same) ...

    @HostListener('window:scroll', [])
    onScroll(): void {
        const SCROLL_THRESHOLD = 500;
        const currentScrollPosition = window.scrollY + window.innerHeight;
        const totalDocumentHeight = document.documentElement.scrollHeight;

        if (currentScrollPosition >= totalDocumentHeight - SCROLL_THRESHOLD) {
            this.loadNextPage();
        }
    }

    startSlideshow(): void {
        this.slideInterval = setInterval(() => { this.nextSlide(); }, 5000);
    }
    // ... (rest of the slideshow methods)
    resetSlideshowTimer(): void {
        clearInterval(this.slideInterval);
        this.startSlideshow();
    }
    nextSlide(): void {
        this.currentSlide.update(current => (current + 1) % this.slides().length);
        this.resetSlideshowTimer();
    }
    prevSlide(): void {
        this.currentSlide.update(current => (current - 1 + this.slides().length) % this.slides().length);
        this.resetSlideshowTimer();
    }
    setCurrentSlide(index: number): void {
        this.currentSlide.set(index);
        this.resetSlideshowTimer();
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
}
