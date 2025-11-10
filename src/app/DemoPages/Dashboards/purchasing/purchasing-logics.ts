import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PurchaseOrder, StockReception, PoStatus } from './purchasing-data';


@Injectable({
  providedIn: 'root'
})
export class PurchasingLogics {

  private baseUrl = 'http://127.0.0.1:8000/api';

  private apiUrl = `${this.baseUrl}/purchasing`;

  private standardHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    // 'Authorization': `Token ${localStorage.getItem('token')}` // Placeholder for Auth
  });

  constructor(private http: HttpClient) { }

  // --- 1. Purchase Order CRUD & Lookup ---

  /**
   * GET: Retrieves a list of all Purchase Orders.
   * DRF Endpoint: /purchasing/orders/
   */
  getPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(
      `${this.apiUrl}/orders/`,
      { headers: this.standardHeaders }
    );
  }

  /**
   * GET: Retrieves a single Purchase Order by ID.
   * DRF Endpoint: /purchasing/orders/{id}/
   */
  getPurchaseOrder(id: number): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(
      `${this.apiUrl}/orders/${id}/`,
      { headers: this.standardHeaders }
    );
  }

  /**
   * POST: Creates a new Purchase Order with nested line items.
   * DRF Endpoint: /purchasing/orders/
   */
  createPurchaseOrder(po: PurchaseOrder): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(
      `${this.apiUrl}/orders/`,
      po,
      { headers: this.standardHeaders }
    );
  }

  /**
   * PUT/PATCH: Updates an existing Purchase Order with nested line items.
   * DRF Endpoint: /purchasing/orders/{id}/
   */
  updatePurchaseOrder(po: PurchaseOrder): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(
      `${this.apiUrl}/orders/${po.id}/`,
      po,
      { headers: this.standardHeaders }
    );
  }

  /**
   * POST: Custom action to update the status of a PO.
   * DRF Endpoint: /purchasing/orders/{id}/update-status/
   */
  updatePoStatus(poId: number, newStatus: PoStatus): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(
      `${this.apiUrl}/orders/${poId}/update-status/`,
      { po_status: newStatus },
      { headers: this.standardHeaders }
    );
  }

  // --- 2. Stock Reception ---

  /**
   * POST: Creates a new Stock Reception entry for a specific PO line item.
   * DRF Endpoint: /purchasing/receptions/
   */
  createStockReception(reception: StockReception): Observable<StockReception> {
    return this.http.post<StockReception>(
      `${this.apiUrl}/receptions/`,
      reception,
      { headers: this.standardHeaders }
    );
  }

  // --- 3. Lookup Data ---

  /**
   * GET: Retrieves a list of all Suppliers for dropdowns.
   * DRF Endpoint: /setups/suppliers/
   */
  getSuppliers(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/setups/suppliers/`,
      { headers: this.standardHeaders }
    );
  }

  /**
   * GET: Retrieves a list of all Products for dropdowns.
   * DRF Endpoint: /products/products/
   */
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/products/products/`,
      { headers: this.standardHeaders }
    );
  }
}
