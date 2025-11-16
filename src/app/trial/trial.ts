import { Component, signal, OnInit, HostListener, ChangeDetectionStrategy } from '@angular/core';

// Define the navigation link structure
interface NavLink {
  label: string;
  link: string;
}

@Component({
  selector: 'app-trial',
  standalone: false,
  template: `
    <nav class="navbar" [class.menu-open]="isMobileMenuOpen()">
      <div class="nav-container">
        <div class="nav-header">

          <div class="nav-left">
            <button (click)="toggleMenu()" type="button" aria-controls="mobile-menu"
                    [attr.aria-expanded]="isMobileMenuOpen()"
                    class="menu-toggle">

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
            <a href="/" class="brand-logo">TechShop</a>
          </div>

          <div class="search-container">
            <div class="search-wrapper">
              <input type="search" placeholder="Search for products..."
                     class="search-input"
                     #searchInput
                     (input)="searchQuery.set(searchInput.value)">

              <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              @if (searchQuery()) {
                <button type="button" class="clear-search-btn" (click)="clearSearch(searchInput)">
                  <svg class="icon-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span class="sr-only">Clear search</span>
                </button>
              }
            </div>
          </div>
          <div class="nav-right">

            <div class="desktop-links">
              @for (nav of mainNavLinks; track nav.label) {
                <a [href]="nav.link"
                  class="nav-link"
                  [class.deal-link]="nav.label === 'Deals'">
                  {{ nav.label }}
                </a>
              }
            </div>

            <button (click)="toggleFilterMenu()" type="button" title="Filter"
                    [attr.aria-expanded]="isFilterMenuOpen()"
                    class="action-icon filter-toggle">
              <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM5 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2zM7 16a1 1 0 011-1h8a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1v-2z" />
              </svg>
              <span class="sr-only">Filter</span>
            </button>


            <a href="/login" title="Sign in" class="action-icon">
              <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span class="sr-only">Sign in</span>
            </a>
            <a href="/cart" title="Cart" class="action-icon cart-icon-wrapper">
              <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span class="sr-only">Cart</span>
              <span class="cart-badge">3</span>
            </a>
          </div>
        </div>

        @if (isMobileMenuOpen()) {
          <div id="mobile-menu" class="mobile-menu-drawer">
            <div class="mobile-links-container">
              @for (nav of mobileNavLinks; track nav.label) {
                <a [href]="nav.link"
                  class="mobile-nav-link"
                  [class.deal-link]="nav.label === 'Deals'">
                  {{ nav.label }}
                </a>
              }
            </div>
          </div>
        }
      </div>
    </nav>

    <div class="content-wrapper">
      <div class="desktop-filter-sidebar">
        <h2>Desktop Filters</h2>
        <ul class="filter-list">
          <li><a href="#">Category 1</a></li>
          <li><a href="#">Category 2</a></li>
          <li><a href="#">Brand A</a></li>
          <li><a href="#">Price Range</a></li>
        </ul>
      </div>

      <div class="content-area">
        <h1>E-commerce Landing Page Content (Pure CSS)</h1>
        <p>Scroll down to see the sticky navigation bar in action! This component is fully responsive and uses native CSS media queries.</p>
        <div class="hero-section">
          <p>Hero Section / Promotional Banner</p>
        </div>
        <div class="product-grid">
          @for (item of [1,2,3,4,5,6,7,8,9,10,11,12]; track item) {
            <div class="product-card">Product Category {{ item }}</div>
          }
        </div>
      </div>
    </div>

    @if (isFilterMenuOpen()) {
      <div class="mobile-filter-drawer">
        <div class="mobile-filter-header">
          <h3>Filters</h3>
          <button (click)="toggleFilterMenu()" class="close-filter-btn" type="button">
            <svg class="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul class="mobile-filter-list">
          <li><a href="#">Category 1</a></li>
          <li><a href="#">Category 2</a></li>
          <li><a href="#">Brand A</a></li>
          <li><a href="#">Price Range</a></li>
          <li><a href="#">Rating</a></li>
          <li><a href="#">In Stock</a></li>
        </ul>
        <div class="apply-filters-btn-container">
          <button class="apply-filters-btn" (click)="toggleFilterMenu()">Apply Filters</button>
        </div>
      </div>
    }

    <footer class="main-footer">
      <div class="footer-content-wrapper">
        <div class="footer-logo">
          TechShop
        </div>
        <div class="footer-links-group">
          <h3>Company</h3>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/careers">Careers</a></li>
            <li><a href="/press">Press</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        <div class="footer-links-group">
          <h3>Shop</h3>
          <ul>
            <li><a href="/shop/tvs">TVs</a></li>
            <li><a href="/shop/accessories">Accessories</a></li>
            <li><a href="/sale">Deals</a></li>
            <li><a href="/support">Support</a></li>
          </ul>
        </div>
        <div class="footer-links-group">
          <h3>Legal</h3>
          <ul>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Service</a></li>
            <li><a href="/refund">Refund Policy</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; 2025 TechShop. All rights reserved.
      </div>
    </footer>
  `,
  styles: [`
    /*
      Variables are defined on :host for scoped use, or hardcoded if necessary.
    */
    :host {
      --primary-color: #4f46e5;      /* indigo-600 */
      --primary-light: #eef2ff;      /* indigo-50 */
      --red-color: #ef4444;          /* red-500 */
      --text-color: #374151;         /* gray-700 */
      --header-height: 4rem;
      --lg-breakpoint: 1024px;
      --filter-sidebar-width: 14rem; /* Width for desktop filter bar */
      --footer-bg-color: #1f2937;    /* Dark blue/gray */
      --footer-text-color: #d1d5db;  /* Light gray */

      display: block;
      min-height: 100vh;
      background-color: #f3f4f6;
      font-family: 'Inter', sans-serif;
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

    /* --- NAVBAR STYLES (UNCHANGED) --- */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 500;
      background-color: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      border-bottom: 1px solid rgba(238, 242, 255, 0.5);
      transition: background-color 0.3s ease;
    }

    .nav-container {
      max-width: 80rem;
      margin-left: auto;
      margin-right: auto;
      padding-left: 1rem;
      padding-right: 1rem;
    }

    @media (min-width: 640px) {
      .nav-container {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }
    }
    @media (min-width: 1024px) {
      .nav-container {
        padding-left: 2rem;
        padding-right: 2rem;
      }
    }

    .nav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--header-height);
      gap: 0.5rem;
    }

    /* 1. LEFT GROUP (UNCHANGED) */
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
      .menu-toggle {
        display: none;
      }
    }

    .brand-logo {
      font-size: 1.25rem;
      font-weight: 900;
      color: var(--primary-color);
      letter-spacing: -0.025em;
      text-decoration: none;
    }

    @media (min-width: 640px) {
      .brand-logo {
        font-size: 1.5rem;
      }
    }

    /* 2. CENTER GROUP: Search (MODIFIED) */
    .search-container {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      order: 2;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }

    @media (min-width: 1024px) {
      .search-container {
        flex-grow: 0;
        max-width: 28rem;
        padding-top: 0;
        padding-bottom: 0;
      }
    }

    .search-wrapper {
      position: relative;
      width: 100%;
      /* Transition wrapper width only on desktop */
      transition: max-width 0.3s ease-in-out;
    }

    @media (min-width: 1024px) {
      .search-wrapper:focus-within {
        /* Slight expansion on focus on desktop */
        max-width: 32rem;
      }
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 1rem 0.5rem 2.5rem;
      font-size: 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 0.75rem;
      transition: all 250ms ease-in-out; /* Increase transition time for smoother effect */
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      /* Add space for the clear button */
      padding-right: 2.5rem;
    }

    .search-input:focus {
      border-color: var(--primary-color);
      outline: 2px solid var(--primary-color);
      outline-offset: 0px;
      /* Add a subtle lift on focus */
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06), 0 0 0 4px var(--primary-light);
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      height: 1.25rem;
      width: 1.25rem;
      color: #9ca3af;
      pointer-events: none; /* Ensure the icon doesn't block input clicks */
    }

    /* New: Clear Button Styles */
    .icon-16 {
      height: 1rem;
      width: 1rem;
    }

    .clear-search-btn {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      padding: 0.25rem;
      border-radius: 50%;
      background-color: #e5e7eb; /* light gray background */
      color: #4b5563; /* dark gray icon color */
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s ease-in-out;
    }

    .clear-search-btn:hover {
      background-color: #d1d5db;
    }
    /* END INTERACTIVE SEARCH STYLES */

    /* 3. RIGHT GROUP (UNCHANGED) */
    .nav-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      order: 3;
    }

    @media (min-width: 1024px) {
      .nav-right {
        gap: 1rem;
      }
    }

    /* Desktop Links (Hidden on small) */
    .desktop-links {
      display: none;
    }

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

    .nav-link:hover {
      color: var(--primary-color);
    }

    .deal-link {
      color: var(--red-color);
      font-weight: 700;
    }

    .deal-link:hover {
      color: #cf3737;
    }

    /* Action Icons (Sign In, Cart, Filter) */
    .icon-24 {
      height: 1.5rem;
      width: 1.5rem;
    }

    .action-icon {
      position: relative;
      padding: 0.5rem;
      border-radius: 0.5rem;
      color: #4b5563;
      transition: all 150ms ease-in-out;
      display: flex;
      align-items: center;
      text-decoration: none;
      border: none;
      background: transparent;
      cursor: pointer;
    }

    .action-icon:hover {
      background-color: var(--primary-light);
      color: var(--primary-color);
    }

    /* Filter Icon Visibility */
    .filter-toggle {
      display: flex; /* Show by default on small/medium */
    }

    @media (min-width: 1024px) {
      .filter-toggle {
        display: none; /* Hide on large devices */
      }
    }

    /* Cart Badge */
    .cart-badge {
      position: absolute;
      top: 0;
      right: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1;
      transform: translate(50%, -50%);
      background-color: var(--red-color);
      color: white;
      border-radius: 9999px;
    }

    /* --- MOBILE MENU DRAWER (UNCHANGED) --- */
    .mobile-menu-drawer {
      border-top: 1px solid rgba(238, 242, 255, 0.5);
      padding-bottom: 0.75rem;
    }

    .mobile-links-container {
      padding: 0.5rem;
    }

    @media (min-width: 640px) {
      .mobile-links-container {
        padding-left: 0.75rem;
        padding-right: 0.75rem;
      }
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

    /* --- CONTENT AND FILTER LAYOUT (UNCHANGED) --- */
    .content-wrapper {
      max-width: 80rem;
      margin-left: auto;
      margin-right: auto;
      display: flex;
      gap: 2rem;
      padding: 0 1rem;
      min-height: calc(100vh - var(--header-height));
    }

    @media (min-width: 1024px) {
      .content-wrapper {
        padding: 0 2rem;
        /* Adjust padding on the right to leave space for the desktop sidebar */
        padding-right: calc(2rem + var(--filter-sidebar-width));
      }
    }


    /* Desktop Filter Sidebar (Right side, fixed) */
    .desktop-filter-sidebar {
      display: none; /* Hidden by default */
    }

    @media (min-width: 1024px) {
      .desktop-filter-sidebar {
        display: block;
        position: fixed;
        top: var(--header-height);
        right: 0;
        width: var(--filter-sidebar-width);
        height: calc(100vh - var(--header-height));
        background-color: white;
        padding: 1.5rem 1rem;
        border-left: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.05);
        z-index: 400;
        overflow-y: auto;
      }

      .desktop-filter-sidebar h2 {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-color);
        margin-bottom: 1rem;
      }

      .filter-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .filter-list li {
        margin-bottom: 0.75rem;
      }

      .filter-list a {
        display: block;
        padding: 0.5rem;
        border-radius: 0.375rem;
        color: #4b5563;
        text-decoration: none;
        transition: all 150ms ease-in-out;
      }

      .filter-list a:hover {
        background-color: var(--primary-light);
        color: var(--primary-color);
      }
    }

    /* Content Area Styling (UNCHANGED) */
    .content-area {
      flex-grow: 1;
      padding: 2rem 0;
      min-height: 100vh;
    }

    @media (min-width: 1024px) {
      .content-area {
        padding-right: 0;
      }
    }

    .content-area h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .content-area p {
      color: #4b5563;
      margin-bottom: 1.5rem;
    }

    .hero-section {
      height: 24rem;
      background-color: var(--primary-light);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-section p {
      color: #4338ca;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 2rem; /* Space before footer */
    }

    @media (min-width: 640px) {
      .product-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1024px) {
      .product-grid {
        /* Reduced to 2 columns on large screens to give space for the desktop sidebar */
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    /* --- ANIMATED PRODUCT CARD STYLES (UNCHANGED) --- */
    .product-card {
      height: 8rem;
      background-color: white;
      padding: 1rem;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      color: var(--text-color);
      /* Add transition for smooth animation */
      transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
      cursor: pointer;
    }

    .product-card:hover {
      /* Lift effect */
      transform: translateY(-4px);
      /* Enhanced shadow */
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    /* --- END ANIMATED PRODUCT CARD STYLES --- */


    /* --- MOBILE FILTER DRAWER (UNCHANGED) --- */
    .mobile-filter-drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      max-height: 80vh;
      background-color: white;
      z-index: 600;
      border-top-left-radius: 1rem;
      border-top-right-radius: 1rem;
      box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -2px rgba(0, 0, 0, 0.1);
      padding: 1rem;
      transition: transform 0.3s ease-out;
      overflow-y: auto;
    }

    @media (min-width: 1024px) {
      .mobile-filter-drawer {
        display: none;
      }
    }

    .mobile-filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .mobile-filter-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0;
    }

    .close-filter-btn {
      padding: 0.5rem;
      border-radius: 0.5rem;
      color: #4b5563;
      border: none;
      background: transparent;
      cursor: pointer;
    }
    .close-filter-btn:hover {
      background-color: var(--primary-light);
    }

    .mobile-filter-list {
      list-style: none;
      padding: 0;
      margin-bottom: 1rem;
    }

    .mobile-filter-list li {
      border-bottom: 1px solid #f3f4f6;
    }

    .mobile-filter-list a {
      display: block;
      padding: 0.75rem 0.5rem;
      color: var(--text-color);
      text-decoration: none;
      font-weight: 500;
    }

    .apply-filters-btn-container {
      padding-top: 0.5rem;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .apply-filters-btn {
      width: 100%;
      padding: 0.75rem 1.5rem;
      background-color: var(--primary-color);
      color: white;
      font-weight: 600;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .apply-filters-btn:hover {
      background-color: #4338ca;
    }


    /* --- FOOTER STYLES (UNCHANGED) --- */
    .main-footer {
      background-color: var(--footer-bg-color);
      padding-top: 3rem;
      color: var(--footer-text-color);
    }

    .footer-content-wrapper {
      max-width: 80rem;
      margin-left: auto;
      margin-right: auto;
      padding: 0 1rem 2rem 1rem;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      border-bottom: 1px solid #374151; /* gray-700 equivalent for border */
    }

    @media (min-width: 640px) {
      .footer-content-wrapper {
        grid-template-columns: 2fr repeat(3, 1fr);
        padding: 0 2rem 2.5rem 2rem;
      }
    }

    .footer-logo {
      font-size: 1.5rem;
      font-weight: 900;
      color: white;
      letter-spacing: -0.025em;
    }

    .footer-links-group h3 {
      font-size: 1rem;
      font-weight: 600;
      color: white;
      margin-bottom: 1rem;
    }

    .footer-links-group ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-links-group li {
      margin-bottom: 0.5rem;
    }

    .footer-links-group a {
      color: var(--footer-text-color);
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }

    .footer-links-group a:hover {
      color: var(--primary-color);
    }

    .footer-bottom {
      max-width: 80rem;
      margin-left: auto;
      margin-right: auto;
      padding: 1rem;
      text-align: center;
      font-size: 0.75rem;
      color: #6b7280; /* gray-500 */
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Trial implements OnInit {
  // Navigation Links array
  readonly navLinks: NavLink[] = [
    { label: 'TVs', link: '/shop/tvs' },
    { label: 'Accessories', link: '/shop/accessories' },
    { label: 'TV Cards', link: '/shop/tv-cards' },
    { label: 'Deals', link: '/sale' },
    { label: 'Support', link: '/support' },
    { label: 'Sign in', link: '/login' },
    { label: 'Cart', link: '/cart' },
  ];

  // New Signal: Tracks the current value of the search input
  searchQuery = signal('');

  // Links specifically for the desktop view
  mainNavLinks: NavLink[] = [];
  // Links for the mobile drawer
  mobileNavLinks: NavLink[] = [];

  // State signal for mobile menu visibility (Left side navigation)
  isMobileMenuOpen = signal(false);

  // State signal for filter menu visibility (Right side filter)
  isFilterMenuOpen = signal(false);

  ngOnInit() {
    // Separate links for desktop bar vs. mobile drawer for cleaner rendering
    this.mainNavLinks = this.navLinks.filter(
      link => link.label !== 'Sign in' && link.label !== 'Cart'
    );
    this.mobileNavLinks = this.navLinks;
  }

  /**
   * Clears the search input field and resets the signal.
   * @param inputElement The reference to the HTML input element.
   */
  clearSearch(inputElement: HTMLInputElement): void {
    inputElement.value = '';
    this.searchQuery.set('');
    inputElement.focus();
  }

  /**
   * Toggles the main mobile menu state.
   */
  toggleMenu(): void {
    this.isMobileMenuOpen.update(current => !current);
    // Close filter menu when opening main menu for better UX on mobile
    if (this.isMobileMenuOpen() && this.isFilterMenuOpen()) {
      this.isFilterMenuOpen.set(false);
    }
  }

  /**
   * Toggles the mobile filter menu state.
   */
  toggleFilterMenu(): void {
    this.isFilterMenuOpen.update(current => !current);
    // Close main menu when opening filter menu for better UX on mobile
    if (this.isFilterMenuOpen() && this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  /**
   * Closes both mobile menus if the window is resized to desktop size (lg breakpoint: 1024px).
   */
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    const lgBreakpoint = 1024;
    if (window.innerWidth >= lgBreakpoint) {
      if (this.isMobileMenuOpen()) {
        this.isMobileMenuOpen.set(false);
      }
      // Close filter menu on resize to large screen
      if (this.isFilterMenuOpen()) {
        this.isFilterMenuOpen.set(false);
      }
    }
  }
}
