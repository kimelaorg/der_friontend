// products/product.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductImage, Product } from './data';

@Injectable({
  providedIn: 'root'
})
export class Logics {

  // Your provided initial URL for the product list
  private initialUrl = 'http://127.0.0.1:8000/api/products/public-catalog/';

  constructor(private http: HttpClient) { }

  /**
   * Fetches the entire public product catalog.
   */
  getProducts(): Observable<Product[]> {
    // The HttpClient.get method handles the API call and returns an Observable
    return this.http.get<Product[]>(this.initialUrl);
  }

  /**
   * Fetches the details for a single product using its ID.
   * This assumes your backend has a route like /api/products/123
   */
  getProductById(id: string): Observable<Product> {
    // Construct the URL dynamically for a single product
    const url = `${this.initialUrl}${id}/`;
    return this.http.get<Product>(url);
  }
}
