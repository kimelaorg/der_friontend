import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryStatus, StockAdjustmentPayload, StockMovementResponse } from './data';

@Injectable({
  providedIn: 'root',
})
export class Inventory {

  private BASE_URL = 'http://localhost:8000/api/inventory/management/';
  private INVENTORY_STATUS_URL = `${this.BASE_URL}`;
  private ADJUSTMENT_URL = `${this.BASE_URL}adjust-stock/`; // Matches the endpoint for StockAdjustmentSerializer

  constructor(private http: HttpClient) { }

  /**
   * Fetches the list of all inventory items and their status.
   * Corresponds to a GET request handled by the InventorySerializer.
   * @returns Observable<InventoryStatus[]>
   */
  getInventoryList(): Observable<any[]> {
    // Assuming the ViewSet lists all items under the base URL or a status path
    return this.http.get<any[]>(this.INVENTORY_STATUS_URL);
  }

  /**
   * Updates an existing inventory item's non-transactional fields (safety_stock_level, location).
   * Corresponds to a PATCH request handled by the InventorySerializer.
   * @param id The primary key ID of the inventory record.
   * @param payload An object containing 'safety_stock_level' and 'location'.
   * @returns Observable<InventoryStatus>
   */
  updateInventoryItem(id: number, payload: any): Observable<any> {
    // Sends PATCH request to /api/inventory/status/<id>/
    return this.http.patch<any>(`${this.INVENTORY_STATUS_URL}${id}/`, payload);
  }

  /**
   * Submits a manual stock adjustment, creating a StockMovement record and updating inventory.
   * Corresponds to a POST request handled by the StockAdjustmentSerializer.
   * @param payload The adjustment data (sku, quantity, reason, cost).
   * @returns Observable<StockMovementResponse>
   */
  submitStockAdjustment(payload: any): Observable<any> {
    // Sends POST request to the custom adjustment endpoint
    return this.http.post<any>(this.ADJUSTMENT_URL, payload);
  }

  // NOTE: You would typically add a getStockMovementHistory method here as well
}
