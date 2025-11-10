import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';



// --- Interface for simplified product display (based on API results) ---
interface ProductListItem {
  id: number;
  name: string;
  brand_name: string;
  min_sale_price: number;
  original_price: number;
  rating: number;
  reviewsCount: number;
  image_url: string;
  screen_size_name: string;
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html', // Now contains the catalog view
  styleUrl: './home.scss', // Now contains all catalog styling
})
export class Home {

  // --- Product Data ---
  public product = {
    name: 'Samsung 50-Inch 4K QLED Smart TV',
    description: 'Experience stunning visuals with 4K upscaling, Quantum HDR, and Q-Symphony sound. Perfect for modern living rooms.',
    price: 699.99,
    rating: 4.5,
    reviews: 1250,
    availability: true,
    sku: 'SAM-QLED-50-2025',
    voltage: '100-240 VAC 50-60 Hz',
    brand: 'Samsung'
  };

  public quantity: number = 1;
  public filterOptions = {
    brands: ['Samsung', 'LG', 'Sony', 'TCL', 'Hisense'],
    display: ['QLED', 'OLED', 'LED'],
    size: ['32 Inches', '40 Inches', '50 Inches', '65 Inches'],
    voltage: ['110V', '220V', 'Universal']
  };

  // --- Action Handlers ---
  addToCart() {
    console.log(`Added ${this.quantity} x ${this.product.name} to cart.`);
    // Add cart logic here
  }

  buyNow() {
    console.log(`Proceeding to checkout with ${this.product.name}.`);
    // Add express checkout logic here
  }

  updateQuantity(operation: 'add' | 'subtract') {
    if (operation === 'add') {
      this.quantity++;
    } else if (operation === 'subtract' && this.quantity > 1) {
      this.quantity--;
    }
  }
}
