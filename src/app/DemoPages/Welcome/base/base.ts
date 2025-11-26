import { Component, signal, OnInit, HostListener, ChangeDetectionStrategy } from '@angular/core';


interface NavLink {
  label: string;
  link: string;
}


@Component({
  selector: 'app-base',
  standalone: false,
  templateUrl: './base.html',
  styleUrl: './base.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Base implements OnInit {

  readonly navLinks: NavLink[] = [
    { label: 'TV Screens', link: '/shop/tvs' },
    { label: 'Motherboards', link: '/shop/tv-cards' },
    { label: 'T-Con', link: '/shop/accessories' },
    { label: 'Accessories', link: '/shop/accessories' },
    { label: 'Software', link: '/shop/tv-cards' },
    { label: 'Deals', link: '/sale' },
    { label: 'Support', link: '/support' },
    { label: 'Sign in', link: '/der/account/login' },
    { label: 'Cart', link: '/cart' },
  ];

  searchQuery = signal('');
  mainNavLinks: NavLink[] = [];
  mobileNavLinks: NavLink[] = [];
  isMobileMenuOpen = signal(false);
  isFilterMenuOpen = signal(false);

  ngOnInit() {
    this.mainNavLinks = this.navLinks.filter(
      link => link.label !== 'Sign in' && link.label !== 'Cart'
    );
    this.mobileNavLinks = this.navLinks;
  }

  clearSearch(inputElement: HTMLInputElement): void {
    inputElement.value = '';
    this.searchQuery.set('');
    inputElement.focus();
  }

  toggleMenu(): void {
    this.isMobileMenuOpen.update(current => !current);
    // Close filter menu when opening main menu for better UX on mobile
    if (this.isMobileMenuOpen() && this.isFilterMenuOpen()) {
      this.isFilterMenuOpen.set(false);
    }
  }

  toggleFilterMenu(): void {
    this.isFilterMenuOpen.update(current => !current);
    // Close main menu when opening filter menu for better UX on mobile
    if (this.isFilterMenuOpen() && this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

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
