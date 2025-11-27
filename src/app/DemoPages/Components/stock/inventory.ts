import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryStatus, StockAdjustmentPayload, StockMovementResponse, Product, Location, InventoryItem } from './data';

@Injectable({
  providedIn: 'root',
})
export class Inventory {

  private BASE_URL = 'http://localhost:8000/api/inventory/management/';
  private INVENTORY_STATUS_URL = `${this.BASE_URL}`;
  private ADJUSTMENT_URL = `${this.BASE_URL}adjust-stock/`;
  private apiUrl = '/api/inventory/management/';
  private productUrl = '/api/products/';
  private locationUrl = '/api/locations/';

  constructor(private http: HttpClient) { }

  getInventoryList(): Observable<any[]> {
    return this.http.get<any[]>(this.INVENTORY_STATUS_URL);
  }

  updateInventoryItem(id: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.INVENTORY_STATUS_URL}${id}/`, payload);
  }

  submitStockAdjustment(payload: any): Observable<any> {
    return this.http.post<any>(this.ADJUSTMENT_URL, payload);
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productUrl);
  }

  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(this.locationUrl);
  }

  addItem(item: Omit<InventoryItem, 'id'>): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(this.apiUrl, item);
  }

  updateItem(item: InventoryItem): Observable<InventoryItem> {
    const url = `${this.apiUrl}${item.id}/`;
    return this.http.put<InventoryItem>(url, item);
  }

  deleteItem(id: number): Observable<void> {
    const url = `${this.apiUrl}${id}/`;
    return this.http.delete<void>(url);
  }


}
