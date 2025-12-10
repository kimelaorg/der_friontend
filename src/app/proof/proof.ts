import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Product, GalleryImage, ProductImage } from './data'; // Import the interfaces
declare var Drift: any;

// --- Placeholder API Base (Replace with your actual base URL) ---
const API_BASE = 'http://127.0.0.1:8000/api';

@Component({
  selector: 'app-proof',
  standalone: false,
  templateUrl: './proof.html',
  styleUrl: './proof.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Proof implements OnInit, AfterViewInit, OnDestroy {

  // 1. Input: Accept the full product object from the parent component
  @Input() productData: Product | undefined;

  // 2. Transformed data for the gallery
  public galleryImages: GalleryImage[] = [];
  public selectedImage: GalleryImage | undefined;

  @ViewChild('mainImage') mainImageRef!: ElementRef<HTMLImageElement>;
  private driftInstance: any;

  ngOnInit() {
    if (this.productData && this.productData.images.length > 0) {
      // 3. Data Transformation: Map backend data to the GalleryImage structure
      this.galleryImages = this.productData.images.map(img => ({
        id: img.id,
        // Using the same URL for all three properties
        thumb: img.image,
        large: img.image,
        zoom: img.image,
      }));

      // Set the initial image
      this.selectedImage = this.galleryImages[0];
    }
  }

  // NOTE: The rest of the component logic (ngAfterViewInit, selectImage, initDriftZoom, ngOnDestroy)
  // remains the same as the previous example, as it relies on the 'selectedImage' and 'galleryImages' arrays.

  // --- (selectImage and initDriftZoom methods from previous answer) ---
  public selectImage(image: GalleryImage): void {
    this.selectedImage = image;
    setTimeout(() => this.initDriftZoom(), 0);
  }

  private initDriftZoom(): void {
    if (this.driftInstance) {
      this.driftInstance.destroy();
    }
    if (this.mainImageRef && this.selectedImage) {
      const mainImageElement = this.mainImageRef.nativeElement;
      this.driftInstance = new Drift(mainImageElement, {
        paneContainer: document.body,
        zoomFactor: 3,
        inlinePane: false,
      });
    }
  }

  ngAfterViewInit() {
    this.initDriftZoom();
  }

  ngOnDestroy(): void {
    if (this.driftInstance) {
      this.driftInstance.destroy();
    }
  }
}
