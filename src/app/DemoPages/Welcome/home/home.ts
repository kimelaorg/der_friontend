import { Component, signal, OnInit, inject, HostListener, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from "@angular/common/http";
import { NavLink, Slide, Product, IConnectivityDetail, IImage, IVideo, IPaginatedProductList, IElectricalSpecs, IProductSpec, IProduct } from "./data";


@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, OnDestroy {

  currentYear: number = new Date().getFullYear();
  private slideInterval: any;
  private url = 'http://127.0.0.1:8000/api/products/public-catalog/';
  // products: IPaginatedProductList = { count: 0, next: null, previous: null, results: [] };
  products: IProduct[];
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

  featuredProducts: Product[] = [
    { name: 'QLED 65-inch 8K TV', price: 2999.00, rating: 5, link: '/product/1', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=8K+TV' },
    { name: 'Noise Cancelling Headphones', price: 249.99, rating: 4, link: '/product/2', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Headphones' },
    { name: 'Smart Video Doorbell', price: 129.50, rating: 4, link: '/product/3', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Doorbell' },
    { name: 'Ultra-Slim Soundbar', price: 499.00, rating: 5, link: '/product/4', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Soundbar' },
    { name: 'Universal Remote Kit', price: 45.99, rating: 3, link: '/product/5', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Remote' },
    { name: 'Streaming Stick 4K', price: 69.99, rating: 5, link: '/product/6', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Streamer' },
  ];

  ngOnInit() {
    this.mainNavLinks = this.navLinks.filter(
        link => link.label !== 'Sign in' && link.label !== 'Cart'
    );
    this.mobileNavLinks = this.navLinks;
    this.startSlideshow();
    this.loadAll();
  }

  ngOnDestroy() {
    if (this.slideInterval) {
        clearInterval(this.slideInterval);
    }
  }

  loadAll(): void {
    this.http.get<IPaginatedProductList>(`${this.url}`).subscribe(res => {
      this.products = res.results;
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

  getStars(rating: number): string {
    const fullStar = '★';
    const emptyStar = '☆';
    const fullCount = Math.floor(rating);
    const emptyCount = 5 - fullCount;
    return fullStar.repeat(fullCount) + emptyStar.repeat(emptyCount);
  }

}
