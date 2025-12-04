import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesRecord, CloseDaySummary, CloseDayResponse } from './sales-data';

@Injectable({
  providedIn: 'root'
})
export class Data {
  private apiUrl = 'http://127.0.0.1:8000/api/sales/';
  private salesUrl = `${this.apiUrl}sales-records/`;
  private closingUrl = `${this.apiUrl}sales-summary/close-day/`;

  constructor(private http: HttpClient) { }

  getSalesRecords(): Observable<SalesRecord[]> {
    return this.http.get<SalesRecord[]>(this.salesUrl);
  }

  closeDay(): Observable<CloseDayResponse> {
    const url = `${this.closingUrl}`;
    return this.http.post<CloseDayResponse>(url, {});
  }

}
