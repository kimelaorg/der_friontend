import { Component, signal, OnInit, HostListener, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Define data interfaces
interface NavLink {
  label: string;
  link: string;
}

interface Slide {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  imgClass: string; // Used for custom background styling
}

interface Product {
  name: string;
  price: number;
  rating: number;
  link: string;
  imgUrl: string; // Placeholder image URL
}

@Component({
  selector: 'app-home',
  standalone: false,
  // imports: [CommonModule],
  template: `
    <!-- NAVIGATION BAR (STICKY) -->
    <nav class="navbar" [class.menu-open]="isMobileMenuOpen()">
      <div class="nav-container">
        <!-- Main Header Row -->
        <div class="nav-header">
          <!-- 1. LEFT GROUP: Mobile Menu Button & Brand Logo -->
          <div class="nav-left">
            <button (click)="toggleMenu()" type="button" aria-controls="mobile-menu"
                    [attr.aria-expanded]="isMobileMenuOpen()" class="menu-toggle">
              @if (!isMobileMenuOpen()) {
                <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              } @else {
                <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            </button>
            <a href="/" class="brand-logo">Daz Electronics</a>
          </div>

          <!-- 2. CENTER GROUP: Search Input (Flexible width on mobile, fixed width on desktop) -->
          <div class="search-container">
            <div class="search-wrapper">
              <input type="search" placeholder="Search for products..." class="search-input">
              <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- 3. RIGHT GROUP: Desktop Links & Mobile/Desktop Actions -->
          <div class="nav-right">
            <!-- Desktop Navigation Links -->
            <div class="desktop-links">
              @for (nav of mainNavLinks; track nav.label) {
                <a [href]="nav.link" class="nav-link" [class.deal-link]="nav.label === 'Deals'">
                  {{ nav.label }}
                </a>
              }
            </div>

            <!-- Action Icons (Sign In & Cart) -->
            <a [routerLink]="'/der/account/login'" title="Sign in" class="action-icon">
              <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span class="sr-only">Sign in</span>
            </a>
            <a [routerLink]="'/wishlist'" title="Wishlist" class="action-icon">
            <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-.318-.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
              <span class="sr-only">Sign in</span>
            </a>
            <a href="/cart" title="Cart" class="action-icon cart-icon-wrapper">
              <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span class="sr-only">Cart</span>
              <span class="cart-badge">3</span>
            </a>
          </div>
        </div>

        <!-- Mobile Menu Drawer -->
        @if (isMobileMenuOpen()) {
          <div id="mobile-menu" class="mobile-menu-drawer">
            <div class="mobile-links-container">
              @for (nav of mobileNavLinks; track nav.label) {
                <a [href]="nav.link" class="mobile-nav-link" [class.deal-link]="nav.label === 'Deals'">
                  {{ nav.label }}
                </a>
              }
            </div>
          </div>
        }
      </div>
    </nav>

    <!-- MAIN CONTENT -->
    <main class="main-content">

      <!-- 1. HERO SLIDESHOW SECTION -->
      <section class="slideshow-section">
        <div class="slideshow-container">
          @for (slide of slides(); track $index) {
            <div class="slide-item" [class]="slide.imgClass" [class.active]="currentSlide() === $index">
              <div class="slide-content">
                <h2 class="slide-subtitle">{{ slide.subtitle }}</h2>
                <h1 class="slide-title">{{ slide.title }}</h1>
                <a [href]="slide.link" class="slide-cta-button">{{ slide.cta }}</a>
              </div>
            </div>
          }

          <!-- Slider Controls -->
          <button (click)="prevSlide()" class="slide-control prev-control" aria-label="Previous Slide">
            <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button (click)="nextSlide()" class="slide-control next-control" aria-label="Next Slide">
            <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </button>

          <!-- Slide Indicators -->
          <div class="slide-indicators">
            @for (slide of slides(); track $index) {
              <button (click)="setCurrentSlide($index)" [class.active]="currentSlide() === $index"
                      class="indicator-dot" [attr.aria-label]="'Go to slide ' + ($index + 1)"></button>
            }
          </div>
        </div>
      </section>

      <!-- 2. FEATURED CATEGORIES -->
      <section class="section-container">
        <h2 class="section-title">Shop By Category</h2>
        <div class="category-grid">
          @for (category of categories; track category.name) {
            <a [href]="category.link" class="category-card">
              <div [innerHTML]="category.icon" class="category-icon"></div>
              <p class="category-name">{{ category.name }}</p>
            </a>
          }
        </div>
      </section>

      <!-- 3. BEST SELLERS / FEATURED PRODUCTS -->
      <section class="section-container">
        <h2 class="section-title">Best Sellers This Week</h2>
        <div class="product-list">
          @for (product of featuredProducts; track product.name) {
            <a [href]="product.link" class="product-card">
              <img [src]="product.imgUrl" [alt]="product.name" class="product-image"
                   onerror="this.onerror=null;this.src='https://placehold.co/400x300/a5b4fc/4338ca?text=Product';" />
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <div class="product-rating">
                  <!-- Star rating representation -->
                  {{ getStars(product.rating) }}
                </div>
                <p class="product-price">\${{ product.price.toFixed(2) }}</p>
                <button class="add-to-cart-button">Add to Cart</button>
              </div>
            </a>
          }
        </div>
      </section>

      <!-- 4. MID-SECTION PROMO BANNER / NEWSLETTER -->
      <section class="section-container">
        <div class="promo-banner">
          <div class="promo-content">
            <h2 class="promo-title">Never Miss a Deal!</h2>
            <p class="promo-subtitle">Sign up for our newsletter to receive exclusive discounts and updates.</p>
            <form class="newsletter-form" (submit)="$event.preventDefault()">
              <input type="email" placeholder="Enter your email address" required class="newsletter-input">
              <button type="submit" class="newsletter-button">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

    </main>

    <!-- FOOTER -->
    <footer class="main-footer">
      <div class="footer-container">
        <div class="footer-col">
          <h4 class="brand-logo footer-logo">Daz Electronics</h4>
          <p>Quality electronics, guaranteed.</p>
          <div class="social-links">
             <a href="#" title="Facebook" class="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg>
             </a>

             <a href="#" title="Twitter" class="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5 0-.58-.02-1.16-.07-1.74a10.05 10.05 0 003-3.8z"></path></svg>
             </a>

             <a href="#" title="Instagram" class="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
             </a>

             <a href="https://wa.me/yourphonenumber" title="WhatsApp" class="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.84 2.87a1.05 1.05 0 011.6 0l.73 1.15c.67 1.06 1.1 2.37 1.1 3.73v.75a7 7 0 11-7-7h.75c1.36 0 2.67.43 3.73 1.1z"></path><path d="M10.74 2.87a1.05 1.05 0 00-1.6 0l-.73 1.15c-.67 1.06-1.1 2.37-1.1 3.73v.75a7 7 0 107-7h-.75c-1.36 0-2.67.43-3.73 1.1z"></path><path d="M19.07 4.93a12 12 0 100 14.14 12 12 0 000-14.14zM12 22a10 10 0 110-20 10 10 0 010 20z"></path><path d="M15 13.5c-.24-.12-.47-.24-.71-.35-.71-.35-1.42-.71-2.13-1.06-.71-.35-1.42-.71-2.13-1.06-.95-.47-1.42-1.42-1.42-2.37V9.5c0-.95.71-1.42 1.42-1.42h.71c.24 0 .47.04.71.12.71.12 1.42.24 2.13.35.71.12 1.42.24 2.13.35.95.12 1.42.59 1.42 1.54V12c0 .95-.71 1.42-1.42 1.42h-.71z"></path></svg>
             </a>

             <a href="#" title="TikTok" class="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H8a5 5 0 00-5 5v8a5 5 0 005 5h8a5 5 0 005-5V8a5 5 0 00-5-5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a1 1 0 110 2 1 1 0 010-2z"></path><path d="M17.5 6.5h.01"></path><path d="M17.5 17.5h.01"></path><path d="M6.5 6.5h.01"></path><path d="M6.5 17.5h.01"></path></svg>
             </a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/careers">Careers</a></li>
            <li><a href="/press">Press</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/returns">Returns</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div class="copyright">
        &copy; {{ currentYear }} Daz Electronics. All rights reserved.
      </div>
    </footer>
  `,
  // Pure CSS derived from previous SCSS is included here
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

    /* Variable approximations */
    :root {
      --primary-color: #4f46e5; /* indigo-600 */
      --primary-hover: #4338ca; /* indigo-700 */
      --primary-light: #eef2ff; /* indigo-50 */
      --red-color: #ef4444; /* red-500 */
      --text-color: #374151; /* gray-700 */
      --header-height: 4rem;
      --lg-breakpoint: 1024px;
    }

    /* Base & Utilities */
    :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: #f3f4f6;
        font-family: 'Inter', sans-serif;
    }

    .main-content {
        flex-grow: 1;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }

    .icon-24 {
        height: 1.5rem;
        width: 1.5rem;
        stroke-width: 2; /* Ensures icon lines are visible */
    }

    .section-container {
        max-width: 100rem;
        margin-left: auto;
        margin-right: auto;
        padding: 2rem 1rem;

        @media (min-width: 640px) {
            padding-left: 1.0rem;
            padding-right: 1.0rem;
        }
    }

    .section-title {
        font-size: 1.875rem;
        font-weight: 800;
        color: #1f2937;
        text-align: center;
        margin-bottom: 2rem;
    }

    /* --- NAVBAR STYLES --- */
    .navbar {
        position: sticky;
        top: 0;
        z-index: 500;
        background-color: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        border-bottom: 1px solid rgba(238, 242, 255, 0.5);
    }
    .nav-container {
        max-width: 100rem;
        margin-left: auto;
        margin-right: auto;
        padding-left: 1rem;
        padding-right: 1rem;
    }
    @media (min-width: 640px) {
        .nav-container { padding-left: 1.5rem; padding-right: 1.5rem; }
    }
    @media (min-width: 1024px) {
        .nav-container { padding-left: 2rem; padding-right: 2rem; }
    }
    .nav-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: var(--header-height);
        gap: 0.5rem;
    }
    .nav-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        order: 1;
    }
    .menu-toggle {
        padding: 0.5rem;
        border-radius: 0.5rem;
        color: #4b5563;
        transition: all 150ms ease-in-out;
        border: none;
        background: transparent;
        cursor: pointer;
    }
    .menu-toggle:hover {
        background-color: var(--primary-light);
        color: var(--primary-color);
    }
    @media (min-width: 1024px) {
        .menu-toggle { display: none; }
    }
    .brand-logo {
        font-size: 0.8rem;
        font-weight: 900;
        color: var(--primary-color);
        letter-spacing: -0.025em;
        text-decoration: none;

    }
    @media (min-width: 640px) {
        .brand-logo {
          font-size: 1.2rem;
        }
    }
    .search-container {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        order: 2;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        max-width: 100%;
    }
    @media (min-width: 1024px) {
        .search-container {
            flex-grow: 0;
            max-width: 28rem;
            padding-top: 0;
            padding-bottom: 0;
        }
    }
    .search-wrapper { position: relative; width: 100%; }
    .search-input {
        width: 100%;
        padding: 0.5rem 1rem 0.5rem 2.5rem;
        font-size: 0.875rem;
        border: 1px solid #d1d5db;
        border-radius: 0.75rem;
        transition: all 150ms ease-in-out;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }
    .search-input:focus {
        border-color: var(--primary-color);
        outline: 2px solid var(--primary-color);
        outline-offset: 0px;
    }
    .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        height: 1.25rem;
        width: 1.25rem;
        color: #9ca3af;
    }
    .nav-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        order: 3;
    }
    @media (min-width: 1024px) {
        .nav-right { gap: 1rem; }
    }
    .desktop-links { display: none; }
    @media (min-width: 1024px) {
        .desktop-links {
            display: flex;
            gap: 1rem;
        }
    }
    .nav-link {
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        font-weight: 500;
        color: #4b5563;
        transition: all 150ms ease-in-out;
        text-decoration: none;
    }
    .nav-link:hover { color: var(--primary-color); }
    .deal-link {
        color: var(--red-color);
        font-weight: 700;
    }
    .deal-link:hover { color: #cf3737; }
    .action-icon {
        position: relative;
        padding: 0.5rem;
        border-radius: 0.5rem;
        color: #4b5563;
        transition: all 150ms ease-in-out;
        display: flex;
        align-items: center;
        text-decoration: none;
    }
    .action-icon:hover {
        background-color: var(--primary-light);
        color: var(--primary-color);
    }
    .cart-badge {
        position: absolute;
        top: 0;
        right: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.5rem; /* Ensure badge size is decent */
        height: 1.5rem;
        padding: 0 0.25rem;
        font-size: 0.75rem;
        font-weight: 700;
        line-height: 1;
        transform: translate(50%, -50%);
        background-color: var(--red-color);
        color: white;
        border-radius: 9999px;
    }
    .mobile-menu-drawer {
        border-top: 1px solid rgba(238, 242, 255, 0.5);
        padding-bottom: 0.75rem;
    }
    .mobile-links-container { padding: 0.5rem; }
    @media (min-width: 640px) {
        .mobile-links-container { padding-left: 0.75rem; padding-right: 0.75rem; }
    }
    .mobile-nav-link {
        display: block;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-color);
        transition: all 150ms ease-in-out;
        text-decoration: none;
    }
    .mobile-nav-link:hover {
        background-color: var(--primary-light);
        color: var(--primary-color);
    }

    /* --- SLIDESHOW STYLES --- */
    .slideshow-section {
        padding-top: 1rem;
        padding-bottom: 2rem;
        max-width: 80rem;
        margin-left: auto;
        margin-right: auto;
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .slideshow-container {
        position: relative;
        height: 18rem;
        overflow: hidden;
        border-radius: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    @media (min-width: 768px) {
        .slideshow-container {
            height: 28rem;
        }
    }

    .slide-item {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.8s ease-in-out;
        background-size: cover;
        background-position: center;
        background-color: #3f51b5; /* Default fallback */
        display: flex;
        align-items: center;
    }
    .slide-item.active {
        opacity: 1;
    }

    /* Mock backgrounds for slides - Use placeholder images/colors */
    .slide-1 {
      background-image: linear-gradient(to right, rgba(0,0,0,0.5), transparent), url('https://placehold.co/1200x600/374151/eef2ff?text=Exclusive+Audio+Deals');
    }
    .slide-2 {
      background-image: linear-gradient(to right, rgba(0,0,0,0.5), transparent), url('https://placehold.co/1200x600/1f2937/d1d5db?text=New+4K+TV+Lineup');
    }
    .slide-3 {
      background-image: linear-gradient(to right, rgba(0,0,0,0.5), transparent), url('https://placehold.co/1200x600/4f46e5/ffffff?text=Smart+Home+Automation');
    }

    .slide-content {
        color: white;
        padding: 2rem;
        max-width: 90%;
        text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
    }

    @media (min-width: 640px) {
        .slide-content {
            padding: 3rem;
            max-width: 50%;
        }
    }

    .slide-subtitle {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: #eef2ff;
    }

    .slide-title {
        font-size: 2.5rem;
        font-weight: 900;
        line-height: 1.1;
        margin-bottom: 1.5rem;
    }

    @media (min-width: 640px) {
        .slide-title {
            font-size: 3.5rem;
        }
    }

    .slide-cta-button {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background-color: var(--red-color);
        color: white;
        font-weight: 600;
        border-radius: 0.75rem;
        text-decoration: none;
        transition: background-color 0.2s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
    .slide-cta-button:hover {
        background-color: #cf3737;
    }

    /* Slideshow Controls */
    .slide-control {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.5rem;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.3s ease;
        z-index: 10;
    }
    .slide-control:hover {
        background: rgba(255, 255, 255, 0.4);
    }
    .prev-control { left: 1rem; }
    .next-control { right: 1rem; }

    /* Indicators */
    .slide-indicators {
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.5rem;
        z-index: 10;
    }
    .indicator-dot {
        height: 0.6rem;
        width: 0.6rem;
        background-color: rgba(255, 255, 255, 0.5);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }
    .indicator-dot.active {
        background-color: var(--primary-color);
        border: 2px solid white;
    }

    /* --- CATEGORY GRID STYLES --- */
    .category-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    @media (min-width: 640px) {
        .category-grid {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    .category-card {
        background-color: white;
        border-radius: 0.75rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        text-decoration: none;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .category-card:hover {
        transform: translateY(-0.25rem);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    }

    .category-icon {
        color: var(--primary-color);
        height: 2.5rem;
        width: 2.5rem;
        margin-bottom: 0.75rem;
    }
    .category-icon > svg {
        height: 100%;
        width: 100%;
    }

    .category-name {
        font-weight: 600;
        color: var(--text-color);
        font-size: 0.875rem;
    }

    /* --- PRODUCT LIST STYLES --- */
    .product-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }

    @media (min-width: 768px) {
        .product-list {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (min-width: 1024px) {
        .product-list {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    .product-card {
        background-color: white;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        text-decoration: none;
        overflow: hidden;
        transition: transform 0.2s ease;
    }
    .product-card:hover {
        transform: translateY(-0.1rem);
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
    }

    .product-image {
        width: 100%;
        height: 10rem;
        object-fit: cover;
        border-bottom: 1px solid #f3f4f6;
    }

    .product-info {
        padding: 1rem;
    }

    .product-name {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
    }

    .product-rating {
        color: #f59e0b; /* amber-500 */
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
    }

    .product-price {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--red-color);
        margin-bottom: 0.75rem;
    }

    .add-to-cart-button {
        width: 100%;
        padding: 0.5rem;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }
    .add-to-cart-button:hover {
        background-color: var(--primary-hover);
    }

    /* --- PROMO BANNER / NEWSLETTER STYLES --- */
    .promo-banner {
        background-color: var(--primary-color);
        border-radius: 1rem;
        padding: 2rem;
        color: white;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        text-align: center;
    }
    .promo-title {
        font-size: 1.875rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
    }
    .promo-subtitle {
        font-size: 1rem;
        font-weight: 400;
        margin-bottom: 1.5rem;
        opacity: 0.9;
    }
    .newsletter-form {
        display: flex;
        flex-direction: column;
        max-width: 28rem;
        margin: 0 auto;
        gap: 0.75rem;
    }
    @media (min-width: 640px) {
        .newsletter-form {
            flex-direction: row;
        }
    }
    .newsletter-input {
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 0.5rem;
        flex-grow: 1;
        font-size: 1rem;
        color: #1f2937;
    }
    .newsletter-button {
        padding: 0.75rem 1.5rem;
        background-color: var(--red-color);
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-weight: 700;
        cursor: pointer;
        transition: background-color 0.2s ease;
        flex-shrink: 0;
    }
    .newsletter-button:hover {
        background-color: #cf3737;
    }

    /* --- FOOTER STYLES --- */
    .main-footer {
        background-color: #1f2937; /* gray-800 */
        color: white;
        padding: 3rem 1rem 1.5rem;
        margin-top: 3rem;
    }
    .footer-container {
        max-width: 80rem;
        margin-left: auto;
        margin-right: auto;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid #4b5563; /* gray-600 */
    }
    @media (min-width: 768px) {
        .footer-container {
            grid-template-columns: repeat(4, 1fr);
            gap: 4rem;
        }
    }
    .footer-col h4 {
        font-size: 1.125rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: #eef2ff;
    }
    .footer-col p {
        font-size: 0.875rem;
        color: #d1d5db;
        line-height: 1.5;
        margin-bottom: 1rem;
    }
    .footer-col ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .footer-col li {
        margin-bottom: 0.5rem;
    }
    .footer-col a {
        color: #d1d5db;
        text-decoration: none;
        font-size: 0.9rem;
        transition: color 0.2s ease;
    }
    .footer-col a:hover {
        color: var(--primary-color);
    }
    .footer-logo {
        color: var(--primary-color);
    }
    .social-links {
        display: flex;
        gap: 0.75rem;
    }
    .social-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 2rem;
        width: 2rem;
        border-radius: 50%;
        background-color: #4b5563;
        color: white;
        font-weight: 700;
        text-decoration: none;
        transition: background-color 0.2s ease;
    }
    .social-icon:hover {
        background-color: var(--primary-color);
    }
    .copyright {
        text-align: center;
        font-size: 0.75rem;
        color: #9ca3af;
        padding-top: 1.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, OnDestroy {
  currentYear: number = new Date().getFullYear();
  private slideInterval: any;

  // --- NAVIGATION DATA ---
  readonly navLinks: NavLink[] = [
    { label: 'TV Screens', link: '/shop/tvs' },
    { label: 'Motherboards', link: '/shop/tv-cards' },
    { label: 'T-Con', link: '/shop/accessories' },
    { label: 'Accessories', link: '/shop/accessories' },
    { label: 'Software', link: '/shop/tv-cards' },
    { label: 'Deals', link: '/sale' },
    { label: 'Support', link: '/support' },
    { label: 'Sign in', link: '/der/account/login' },
    { label: 'Wishlist', link: '/wishlist' },
    { label: 'Cart', link: '/cart' },
  ];
  mainNavLinks: NavLink[] = [];
  mobileNavLinks: NavLink[] = [];
  isMobileMenuOpen = signal(false);

  // --- HOMEPAGE CONTENT DATA ---
  slides = signal<Slide[]>([
    { title: 'The Future of Sound', subtitle: 'New Audio Series - Up to 40% Off.', cta: 'Shop Now', link: '/sale/audio', imgClass: 'slide-1' },
    { title: 'Big Screen, Bigger Deals', subtitle: '4K QLED TVs starting at $499.', cta: 'Explore TVs', link: '/shop/tvs', imgClass: 'slide-2' },
    { title: 'Smart Home Essentials', subtitle: 'Control your life with our automation kits.', cta: 'See Kits', link: '/shop/smarthome', imgClass: 'slide-3' },
  ]);
  currentSlide = signal(0);

  categories: { name: string, icon: string, link: string }[] = [
    { name: 'Televisions', link: '/shop/tvs', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>' },
    { name: 'Audio & Sound', link: '/shop/audio', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 2H9.5L6 6v12l3.5 4h6l3.5-4V6l-3.5-4z"/><path d="M9.5 17h6"/><path d="M12 17v4"/></svg>' },
    { name: 'Smart Home', link: '/shop/smarthome', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { name: 'Accessories', link: '/shop/accessories', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' }
  ];

  featuredProducts: Product[] = [
    { name: 'QLED 65-inch 8K TV', price: 2999.00, rating: 5, link: '/product/1', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=8K+TV' },
    { name: 'Noise Cancelling Headphones', price: 249.99, rating: 4, link: '/product/2', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Headphones' },
    { name: 'Smart Video Doorbell', price: 129.50, rating: 4, link: '/product/3', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Doorbell' },
    { name: 'Ultra-Slim Soundbar', price: 499.00, rating: 5, link: '/product/4', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Soundbar' },
    { name: 'Universal Remote Kit', price: 45.99, rating: 3, link: '/product/5', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Remote' },
    { name: 'Streaming Stick 4K', price: 69.99, rating: 5, link: '/product/6', imgUrl: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Streamer' },
  ];

  ngOnInit() {
    // Separate navigation links for desktop and mobile
    this.mainNavLinks = this.navLinks.filter(
        link => link.label !== 'Sign in' && link.label !== 'Cart'
    );
    this.mobileNavLinks = this.navLinks;

    // Start the slideshow auto-advance
    this.startSlideshow();
  }

  ngOnDestroy() {
    // Clean up the interval to prevent memory leaks
    if (this.slideInterval) {
        clearInterval(this.slideInterval);
    }
  }

  /**
   * Toggles the mobile menu state.
   */
  toggleMenu(): void {
    this.isMobileMenuOpen.update(current => !current);
  }

  /**
   * Closes the mobile menu if the window is resized to desktop size (lg breakpoint: 1024px).
   */
  @HostListener('window:resize')
  onResize(): void {
    const lgBreakpoint = 1024;
    // Close menu if resized to desktop view
    if (window.innerWidth >= lgBreakpoint && this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  // --- SLIDESHOW LOGIC ---

  startSlideshow(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Change slide every 5 seconds
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

  // --- UTILITIES ---

  /**
   * Converts a numerical rating into a string of star icons.
   */
  getStars(rating: number): string {
    const fullStar = '★';
    const emptyStar = '☆';
    const fullCount = Math.floor(rating);
    const emptyCount = 5 - fullCount;
    return fullStar.repeat(fullCount) + emptyStar.repeat(emptyCount);
  }
}
