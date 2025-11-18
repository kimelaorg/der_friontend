import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SaleTransactionPayload, SaleResponse, ProductSpec } from './sales-data';

@Injectable({
  providedIn: 'root',
})
export class Data {
  
  private http = inject(HttpClient);

  // Base URL for the Django backend API
  private BASE_API_URL = 'http://localhost:8000/api/v1/';
  private TRANSACTION_URL = `${this.BASE_API_URL}sales/record/`;

  // NOTE: This is a mock implementation for product lookup, replace with your actual DRF endpoint
  getProductBySku(sku: string): Observable<ProductSpec> {
    // Mock data based on the SKU input for demonstration
    if (sku === 'TV-4K-55') {
        return of({ id: 101, sku: 'TV-4K-55', name: '4K Smart TV', unitPrice: 599.99, inventoryStatus: 'OK' });
    }
    if (sku === 'KEY-MX') {
        return of({ id: 202, sku: 'KEY-MX', name: 'Mechanical Keyboard', unitPrice: 120.00, inventoryStatus: 'OK' });
    }
    // Simulate API error for unknown SKU
    return new Observable(observer => {
        observer.error({ status: 404, message: 'Product not found' });
    });
  }

  submitSaleTransaction(payload: SaleTransactionPayload): Observable<SaleResponse> {
    // This calls the SaleTransactionAPIView endpoint
    return this.http.post<SaleResponse>(this.TRANSACTION_URL, payload);
  }
}
