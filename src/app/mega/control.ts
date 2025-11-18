import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interface for a generic lookup item (for dropdowns)
 */
export interface LookupItem {
  id: number;
  name: string;
}

/**
 * Interface representing the structure of the data submitted before conversion to FormData.
 * Needed for component logic.
 */
export interface ProductPayload {
  name: string;
  description: string;
  category: number;
  is_active: boolean;
  specification: any;
}


@Injectable({
  providedIn: 'root',
})
export class Control {

  // Base URL remains the same
  private apiUrl = 'http://127.0.0.1:8000/api';

  // Define the specific path for the products resource
  private productPath = '/mega/products/';

  // Base path for setup/lookup tables
  private setupPath = '/setups';

  constructor(private http: HttpClient) { }

// ## Product CRUD Methods (Using FormData)

  /**
   * POSTs the complex, nested product payload as FormData, required for file uploads.
   */
  createProduct(payload: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}${this.productPath}`, payload);
  }

  /**
   * GETs a single product.
   */
  getProduct(productId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}${this.productPath}${productId}/`);
  }

  /**
   * PATCHes an existing product as FormData.
   */
  updateProduct(productId: number, payload: FormData): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}${this.productPath}${productId}/`, payload);
  }

// ---

// ## Lookup Data Fetching Methods

  /**
   * Fetches the list of product categories (FK).
   */
  getCategories(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.apiUrl}${this.setupPath}/categories/`);
  }

  /**
   * Fetches the list of brands (FK).
   */
  getBrands(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.apiUrl}${this.setupPath}/brands/`);
  }

  /**
   * Fetches the list of screen sizes (FK).
   */
  getScreenSizes(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.apiUrl}${this.setupPath}/screen-sizes/`);
  }

  /**
   * Fetches the list of resolutions (FK).
   */
  getSupportedResolutions(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.apiUrl}${this.setupPath}/resolutions/`);
  }

  /**
   * Fetches the list of panel types (FK).
   */
  getPanelTypes(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.apiUrl}${this.setupPath}/panel-types/`);
  }

  /**
   * Fetches the list of supported internet services (M2M).
   */
  getSupportedInternetServices(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.apiUrl}${this.setupPath}/internet-services/`);
  }

  /**
   * Fetches the list of connectivity types (FK for the dynamic array).
   */
  getConnectivityTypes(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.apiUrl}${this.setupPath}/connectivity/`);
  }
}
