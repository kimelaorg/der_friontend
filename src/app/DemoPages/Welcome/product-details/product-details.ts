import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { EMPTY, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Logics } from './logics';
import { Cart } from './cart';
import { Product, ProductImage, UserReview } from './data'; // Use the correct path

// --- External Library Imports ---
declare const Drift: any;     // Global variable for Drift Zoom
declare const GLightbox: any;
declare const AOS: any;


@Component({
  selector: 'app-product-details',
  standalone: false,
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails implements OnInit, AfterViewInit, OnDestroy {

  product: Product | undefined;
  isLoading = true;
  error: string | null = null;
  private routeSub: Subscription | undefined;
  quantity: number = 1;
  selectedSize: string = 'M'
  alertMessage: string | null = null;
  alertType: 'success' | 'danger' = 'success';

  // Image Zoom/Gallery instances
  private driftZoom: any;
  private gallery: any;

  // State for the main image and variant selection
  mainImageUrl: string = '';
  selectedColor: string = '';
  public Math = Math;

  constructor(
    private route: ActivatedRoute,
    private productService: Logics,
    private cartService: Cart
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isLoading = true;
          return this.productService.getProductById(id);
        }
        // If ID is missing, return EMPTY, which immediately completes the observable stream.
        return EMPTY; // <-- Use EMPTY from RxJS
      })
    ).subscribe({
      next: (data: any) => { // Use 'any' here temporarily if the type check is still strict during development
        this.product = data as Product;
        this.isLoading = false;

        // Set initial state
        this.mainImageUrl = this.product.images.length > 0 ? this.product.images[0].image : '';
        this.selectedColor = this.product.color || '';

        // Ensure Drift and GLightbox are initialized after data is set
        this.setupImageLibraries();
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800, // Duration of animation (ms)
                once: true     // Whether animation should happen only once - recommended for e-commerce
            });
            AOS.refresh(); // Important to refresh after DOM updates
        }
      },
      error: (err) => {
        console.error('Failed to load product details:', err);
        this.error = 'Product not found or an error occurred.';
        this.isLoading = false;
      }
    });
  }

  // --- Data Transformation Getters ---

  get salePriceNumber(): number {
    return this.product ? parseFloat(this.product.discounted_price) : 0;
  }

  get originalPriceNumber(): number {
    return this.product ? parseFloat(this.product.actual_price) : 0;
  }

  get quantityInStockNumber(): number {
    return this.product ? parseInt(this.product.quantity_in_stock, 10) : 0;
  }

  get totalReviews(): number {
    return this.product?.user_reviews.length || 0;
  }

  get averageRating(): number {
    if (!this.product || this.totalReviews === 0) return 0;
    const sum = this.product.user_reviews.reduce((acc, review) => acc + review.rating, 0);
    return parseFloat((sum / this.totalReviews).toFixed(1));
  }

  // --- Image Handling and Library Setup ---

  ngAfterViewInit(): void {
    // Initial setup if data loads quickly
    if (this.product) {
        this.setupImageLibraries();
    }
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  setupImageLibraries(): void {
    // 1. Drift Zoom (Image Hover Effect)
    // Destroy previous instance if navigating between products
    if (this.driftZoom) {
        this.driftZoom.destroy();
    }

    // Initialize Drift on the main image element
    // We target the image by its ID
    const mainImageElement = document.getElementById('main-product-image');
    if (mainImageElement) {
        this.driftZoom = new Drift(mainImageElement, {
            paneContainer: mainImageElement.parentElement, // Attach the zoomed pane to the image container
            inlinePane: 900, // Show inline pane on screens smaller than 900px
            zoomFactor: 3
        });
    }

    // 2. GLightbox (Full-Screen Image Gallery)
    // Destroy previous instance
    if (this.gallery) {
        this.gallery.destroy();
    }

    // Initialize GLightbox on all thumbnail links
    // Assuming you wrap your thumbnail images in an anchor tag with data-gallery="product-gallery"
    this.gallery = GLightbox({
        selector: '.glightbox-item', // Use a class selector
        touchNavigation: true,
        loop: true,
        autoplayVideos: true,
    });
  }

  selectMainImage(imageUrl: string): void {
    this.mainImageUrl = imageUrl;

    // For Drift Zoom to work correctly, you must update the 'data-zoom' attribute
    const mainImageElement = document.getElementById('main-product-image');
    if (mainImageElement) {
        mainImageElement.setAttribute('data-zoom', imageUrl);
        // Note: Drift needs a small refresh or re-init in complex scenarios,
        // but simple attribute change often works.
    }

    // Update active thumbnail class if you've implemented it
  }

  selectVariant(variantColor: string): void {
    this.selectedColor = variantColor;
    // Here you would also update the main image to the variant-specific image if your API supports it.
  }

  // --- Component Lifecycle Cleanup ---
  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    if (this.driftZoom) {
      this.driftZoom.destroy();
    }
    if (this.gallery) {
      this.gallery.destroy();
    }
  }

  addToCart(): void {
    // Clear any previous alert
    this.alertMessage = null;

    if (this.product && this.quantity > 0) {
      // 1. Add item to cart service
      this.cartService.addItem(
        this.product,
        this.quantity,
        this.selectedColor,
        this.selectedSize
      );

      // 2. Set success alert state
      this.alertType = 'success';
      this.alertMessage = `${this.product.parent_product_name} added to your cart successfully!`;

    } else {
      // 3. Set error alert state
      this.alertType = 'danger';
      this.alertMessage = 'Quantity required. Please select a quantity greater than zero.';
    }

    // Optional: Auto-hide the alert after 5 seconds
    setTimeout(() => {
      this.alertMessage = null;
    }, 5000);
  }
  
}
