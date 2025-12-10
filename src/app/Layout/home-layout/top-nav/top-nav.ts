import { Component, signal, OnInit, inject, HostListener, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from "@angular/common/http";


export interface NavLink {
  label: string;
  link: string;
}

export interface Slide {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  imgClass: string; // Used for custom background styling
}


@Component({
  selector: 'app-top-nav',
  standalone: false,
  templateUrl: './top-nav.html',
  styleUrl: './top-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNav implements OnInit, OnDestroy {

  private slideInterval: any;

  private router = inject(Router);

  readonly navLinks: NavLink[] = [
    { label: 'Home', link: '/der' },
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
  }

  ngOnDestroy() {
    if (this.slideInterval) {
        clearInterval(this.slideInterval);
    }
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

}
