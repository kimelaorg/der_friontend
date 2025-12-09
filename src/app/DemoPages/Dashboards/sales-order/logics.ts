import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderCreationPayload, User, Product } from './data';

@Injectable({
  providedIn: 'root',
})
export class Logics {

  private apiUrl = '/api/orders/';
  private userSearchUrl = '/api/users/search/';
  private productListUrl = '/api/products/';

  constructor(private http: HttpClient) { }

  /** Sends the complex order creation payload to the Django API. */
  createAgentOrder(payload: OrderCreationPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  /** Searches for customers by name or email. */
  searchCustomers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.userSearchUrl}?q=${query}`);
  }

  /** Gets all available products (simplified). */
  getAvailableProducts(): Observable<Product[]> {
    // NOTE: In a real app, this should be filtered/paginated
    return this.http.get<Product[]>(this.productListUrl);
  }

}
