import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { ExpensePayload, Entity, DistrictEntity, WardEntity, StreetEntity, PostcodeEntity, AddressDataResponse } from './data';


@Injectable({
  providedIn: 'root'
})
export class Logic {

  private baseUrl = 'http://127.0.0.1:8000/api';
  private apiUrl = `${this.baseUrl}/expenses/data/`;
  private categoriesUrl = `${this.baseUrl}/expenses/categories/`;
  private payeesUrl = `${this.baseUrl}/expenses/payees/`;
  private locationsUrl = `${this.baseUrl}/auth/locations/`;

  constructor(private http: HttpClient) {}

  // --- GET Methods for Expense-related Selects (Unchanged) ---

  getAllExpenses(): Observable<ExpensePayload[]> {
    return this.http.get<ExpensePayload[]>(this.apiUrl);
  }

  fetchCategories(): Observable<Entity[]> {
    return this.http.get<Entity[]>(this.categoriesUrl);
  }

  fetchPayees(): Observable<Entity[]> {
    return this.http.get<Entity[]>(this.payeesUrl);
  }

  // --- NEW/UPDATED: Location Methods using the Generic API View ---

  fetchRegions(): Observable<Entity[]> {
    return this.http.get<Entity[]>(this.locationsUrl);
  }

  // 2. Fetches Districts for a specific Region.
  fetchDistrictsByRegion(regionName: string): Observable<DistrictEntity[]> {
    let params = new HttpParams()
      .set('level', 'districts') // <-- Correct parameter
      .set('region', regionName); // <-- Correct parameter

    return this.http.get<DistrictEntity[]>(this.locationsUrl, { params });
  }
 
  // 3. Fetches Wards for a specific District and Region.
  fetchWardsByDistrict(regionName: string, districtName: string): Observable<WardEntity[]> {
    let params = new HttpParams()
      .set('level', 'wards') // <-- Correct parameter
      .set('region', regionName)
      .set('district', districtName); // <-- Correct parameter
     
    return this.http.get<WardEntity[]>(this.locationsUrl, { params });
  }

  // Assuming this is within a LocationService class that imports HttpClient and HttpParams
  fetchStreetsByWard(regionName: string, districtName: string, wardName: string): Observable<StreetEntity[]> {
    // 1. Initialize HttpParams
    let params = new HttpParams()
        .set('level', 'streets')
        .set('region', regionName)
        .set('district', districtName)
        .set('ward', wardName);

    return this.http.get<StreetEntity[]>(this.locationsUrl, { params });
  }

  // Assuming this is within a LocationService class that imports HttpClient and HttpParams
    fetchPostcodesByStreet(regionName: string, districtName: string, wardName: string, streetName: string): Observable<PostcodeEntity[]> {
        // 1. Initialize HttpParams
        let params = new HttpParams()
            // Level must be set to 'postcodes' to fetch the final list
            .set('level', 'postcodes')
            // Include all ancestor locations for precise filtering
            .set('region', regionName)
            .set('district', districtName)
            .set('ward', wardName)
            .set('street', streetName);

        // 2. Make the HTTP GET request
        // Assumes PostcodeEntity is defined (e.g., { id: string, code: string, name: string })
        return this.http.get<PostcodeEntity[]>(this.locationsUrl, { params });
    }

  /**
   * Replaced with fetchDistrictsByRegion and fetchWardsByDistrict to use the single endpoint.
   * This method is no longer used for dynamic loading but is kept to show the structure difference.
   */
  fetchAddressData(): Observable<AddressDataResponse> {
    // Note: This is inefficient for dynamic loading. It should only be used if
    // the whole dataset needs to be loaded once for local filtering.
    throw new Error("fetchAddressData is deprecated. Use targeted methods.");
  }

  // --- POST Method for Expense Creation (Unchanged) ---

  createExpense(payload: ExpensePayload): Observable<any> {
    console.log('Sending expense payload to:', this.apiUrl, payload);
    return this.http.post<any>(this.apiUrl, payload);
  }
}
