// src/app/services/sales.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaleRecord } from './sales-data';

@Injectable({
  providedIn: 'root'
})
export class Data {
  private apiUrl = 'http://127.0.0.1:8000/api/sales/sales-records/'; // Your specified API endpoint

  constructor(private http: HttpClient) { }

  getSalesRecords(): Observable<SaleRecord[]> {
    return this.http.get<SaleRecord[]>(this.apiUrl);
  }
}
