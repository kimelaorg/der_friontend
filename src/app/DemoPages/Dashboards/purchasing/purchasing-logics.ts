import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
// Import all necessary data interfaces, including Supplier and Product for better type safety
import {
    PurchaseOrder, StockReception, PoStatus, Supplier, Product, SupplierData,
    PurchaseOrderItem, ReceptionPayload, ReceptionRecord
  } from './purchasing-data';


@Injectable({
    providedIn: 'root'
})
export class PurchasingLogics {

    private baseUrl = 'http://127.0.0.1:8000/api';

    private apiUrl = `${this.baseUrl}/purchasing`;
    private supplierSetupUrl = `${this.baseUrl}/setups/suppliers/`;
    private productSetupUrl = `${this.baseUrl}/products/products/`;
    private receptionsUrl = `${this.apiUrl}/receptions/`;
    private itemsUrl = `${this.apiUrl}/orders/`;
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
    getPurchaseOrders(): Observable<any[]> {
        return this.http.get<any[]>(
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

    // --- 3. Supplier CRUD ---

    /**
     * GET: Retrieves a list of all Suppliers.
     * DRF Endpoint: /setups/suppliers/
     */
  getSuppliers(): Observable<SupplierData[]> {
        return this.http.get<SupplierData[]>(
            this.supplierSetupUrl,
            { headers: this.standardHeaders }
        );
    }

    /**
     * POST: Creates a new Supplier.
     * DRF Endpoint: /setups/suppliers/
     */
  createSupplier(supplier: Omit<Supplier, 'id'>): Observable<Supplier> {
        return this.http.post<Supplier>(
            this.supplierSetupUrl,
            supplier,
            { headers: this.standardHeaders }
        );
    }

    /**
     * PUT/PATCH: Updates an existing Supplier.
     * DRF Endpoint: /setups/suppliers/{id}/
     */
  updateSupplier(supplier: Supplier): Observable<Supplier> {
        return this.http.put<Supplier>(
            `${this.supplierSetupUrl}${supplier.id}/`,
            supplier,
            { headers: this.standardHeaders }
        );
    }

    /**
     * DELETE: Deletes a Supplier by ID.
     * DRF Endpoint: /setups/suppliers/{id}/
     */
  deleteSupplier(id: number): Observable<void> {
        return this.http.delete<void>(
            `${this.supplierSetupUrl}${id}/`,
            { headers: this.standardHeaders }
        );
    }


    // --- 4. Product Lookup Data ---

    /**
     * GET: Retrieves a list of all Products for dropdowns.
     * DRF Endpoint: /products/products/
     */
  getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(
            this.productSetupUrl,
            { headers: this.standardHeaders }
        );
    }

  getAllReceptions(): Observable<ReceptionRecord[]> {
    return this.http.get<ReceptionRecord[]>(this.receptionsUrl);
  }

  createReception(payload: ReceptionPayload): Observable<ReceptionRecord> {
    return this.http.post<ReceptionRecord>(this.receptionsUrl, payload);
  }

  updateReception(id: number, payload: ReceptionPayload): Observable<ReceptionRecord> {
    return this.http.put<ReceptionRecord>(`${this.receptionsUrl}${id}/`, payload);
  }

  deleteReception(id: number): Observable<any> {
    return this.http.delete(`${this.receptionsUrl}${id}/`);
  }

  // --- Lookup Data ---

  getPurchaseOrderItems(): Observable<PurchaseOrderItem[]> {
    // NOTE: This call should filter items that are "fully received" in a real app
    return this.http.get<PurchaseOrderItem[]>(this.itemsUrl);
  }

}
