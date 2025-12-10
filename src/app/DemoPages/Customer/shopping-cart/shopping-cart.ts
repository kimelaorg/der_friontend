import { Component, OnInit } from '@angular/core';
import { CartItem } from '../../Welcome/product-details/data';
import { Cart } from '../../Welcome/product-details/cart';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-shopping-cart',
  standalone: false,
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.scss',
})
export class ShoppingCart implements OnInit {

  cartItems$: Observable<CartItem[]>;

  constructor(public cartService: Cart) { // Inject CartService
    this.cartItems$ = this.cartService.cartItems$; // Subscribe to the cart stream
  }

  ngOnInit(): void {}

  getItemSubtotal(item: CartItem): number {
    // 1. Ensure the discounted price is treated as a number
    const price = parseFloat(item.product.discounted_price);

    // 2. Safely return the calculated total
    if (isNaN(price)) {
      console.warn(`Invalid price string found for product ID ${item.product.id}: ${item.product.discounted_price}`);
      return 0;
    }

    return price * item.quantity;
  }

  // Event handlers
  removeItem(itemId: number): void {
    this.cartService.removeItem(itemId);
  }

  updateQuantity(itemId: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const newQuantity = parseInt(inputElement.value, 10);
    this.cartService.updateQuantity(itemId, newQuantity);
  }

}
