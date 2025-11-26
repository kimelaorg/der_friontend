import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for (ngModel) binding
import { SalesRecord, Customer } from './sales-data';

// Import RxJS operators and core
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap, finalize, map } from 'rxjs/operators';
import { Form, FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-sales-view',
  standalone: false,
  templateUrl: './sales-view.html',
  styleUrl: './sales-view.scss',
})
export class SalesView implements OnInit {

  heading = 'Sales Data';
  subheading = 'View Sales Details';
  icon = 'pe-7s-cash text-success';

  // Sales Filtering Properties
  public allSalesRecords: SalesRecord[] = [];
  public salesRecords: SalesRecord[] = [];
  public selectedFilter: string = 'all';

  // Sale Submission Properties (USING Angular Signals)
  public customerForm!: FormGroup;
  public paymentForm!: FormGroup;

  public submissionLoading = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);
  public backendCustomerId = signal<string | null>(null);
  public currentStage = signal<number>(2);

  // Placeholder functions for external dependencies
  public cartItems = () => [{ product_specification_id: 1, quantity: 1, unit_price: 10.00, unit_measure: 'pc' }];
  public resetComponent = () => {};

  // NOTE: Replace with your actual API endpoint constants
  readonly CUSTOMER_CREATE_API = '/api/customers/create-or-update/';
  readonly SALES_RECORD_API = 'http://127.0.0.1:8000/api/sales/sales-records/';


  constructor(private fb: FormBuilder, private http: HttpClient /* Angular HttpClient assumed */) {
    // Initialize dummy forms for the sake of compiling the methods
    this.customerForm = this.fb.group({
      first_name: [''],
      last_name: [''],
      phone_number: ['', Validators.pattern(/^\d{10}$/)],
      email: ['', Validators.email]
    });
    this.paymentForm = this.fb.group({
      payment_method: ['CASH', Validators.required],
      payment_status: ['PAID', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAll()
    this.salesRecords = this.allSalesRecords; // Initialize table with all data
  }

  loadAll(): void {
    this.http.get<SalesRecord[]>(`${this.SALES_RECORD_API}`).subscribe(res => {
      this.allSalesRecords = res;
    });
  }


  /** Helper function to apply title case to a single string. */
  private toTitleCase(value: string | null | undefined): string {
      if (!value) return '';
      return String(value).toLowerCase().split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
  }

  /** Calculates the total quantity of items. */
  getTotalQuantity(record: SalesRecord): number {
    return record.items.reduce((sum, item) => sum + item.quantity, 0);
  }


  // =========================================================================
  // === FILTERING METHODS ===
  // =========================================================================

  onFilterChange(): void {
    if (this.selectedFilter === 'all') {
      this.salesRecords = this.allSalesRecords;
      return;
    }

    const now = new Date();
    this.salesRecords = this.allSalesRecords.filter(record => {
      const saleDate = new Date(record.sale_date);

      // 1. Daily Sales Filters
      if (this.selectedFilter === 'today') {
        return this.isSameDay(saleDate, now);
      }
      if (this.selectedFilter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return this.isSameDay(saleDate, yesterday);
      }
      if (this.selectedFilter === 'day-before-yesterday') {
        const dayBeforeYesterday = new Date(now);
        dayBeforeYesterday.setDate(now.getDate() - 2);
        return this.isSameDay(saleDate, dayBeforeYesterday);
      }
      // Specific date filter: date-21.11.2025
      if (this.selectedFilter.startsWith('date-')) {
        const targetDateString = this.selectedFilter.substring(5);
        const [day, month, year] = targetDateString.split('.').map(Number);
        const targetDate = new Date(year, month - 1, day); // Month is 0-indexed
        return this.isSameDay(saleDate, targetDate);
      }

      // 2. Weekly Sales Filters
      if (this.selectedFilter === 'current-week') {
        return this.isSameWeek(saleDate, now);
      }

      // 3. Monthly Sales Filters
      if (this.selectedFilter === 'current-month') {
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
      // Specific month filter: month-10-2025
      if (this.selectedFilter.startsWith('month-')) {
        const [targetMonth, targetYear] = this.selectedFilter.substring(6).split('-').map(Number);
        return saleDate.getMonth() === targetMonth && saleDate.getFullYear() === targetYear;
      }

      return false;
    });
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private isSameWeek(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setDate(d1.getDate() - d1.getDay());
    d2.setDate(d2.getDate() - d2.getDay());
    return d1.getTime() === d2.getTime();
  }
}
