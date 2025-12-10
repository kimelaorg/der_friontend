
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product, CartItem } from './data'; // Use your existing Product interface


@Injectable({
  providedIn: 'root'
})
export class Cart {
  // Use BehaviorSubject to hold the cart state and emit updates
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  constructor() {
    // Load cart from local storage on startup (best practice)
    this.loadCart();
  }

  private loadCart(): void {
    const items = localStorage.getItem('ecom_cart');
    if (items) {
      this.cartItemsSubject.next(JSON.parse(items));
    }
  }

  private saveCart(): void {
    localStorage.setItem('ecom_cart', JSON.stringify(this.cartItemsSubject.value));
  }

  /**
   * Adds a product to the cart or increments quantity if it exists.
   */
  addItem(product: Product, quantity: number, color: string, size: string): void {
    const items = this.cartItemsSubject.value;
    const existingItem = items.find(
      i => i.product.id === product.id && i.selectedColor === color && i.selectedSize === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const newItem: CartItem = {
        id: Date.now(), // Unique ID for the cart item instance
        product: product,
        quantity: quantity,
        selectedColor: color,
        selectedSize: size
      };
      items.push(newItem);
    }

    this.cartItemsSubject.next(items);
    this.saveCart();
  }

  /**
   * Removes an item from the cart.
   */
  removeItem(itemId: number): void {
    const items = this.cartItemsSubject.value.filter(i => i.id !== itemId);
    this.cartItemsSubject.next(items);
    this.saveCart();
  }

  /**
   * Updates the quantity of a specific item.
   */
  updateQuantity(itemId: number, newQuantity: number): void {
    const items = this.cartItemsSubject.value;
    const item = items.find(i => i.id === itemId);

    if (item) {
      item.quantity = newQuantity > 0 ? newQuantity : 1; // Prevent 0 or negative
    }

    this.cartItemsSubject.next(items);
    this.saveCart();
  }

  // --- Cart Calculations ---

  get subtotal(): number {
    return this.cartItemsSubject.value.reduce((total, item) => {
      // Use the discounted price for the total
      const price = parseFloat(item.product.discounted_price);
      return total + (price * item.quantity);
    }, 0);
  }

  // Placeholder for tax and shipping logic
  get tax(): number {
    // Assuming a flat tax rate for simplicity (e.g., 5%)
    return this.subtotal * 0.05;
  }

  get shippingCost(): number {
    // Placeholder logic for shipping cost
    // Assume free shipping over $300 (or the local currency equivalent)
    return this.subtotal >= 300 ? 0 : 4.99;
  }

  get total(): number {
    return this.subtotal + this.tax + this.shippingCost;
  }
}
