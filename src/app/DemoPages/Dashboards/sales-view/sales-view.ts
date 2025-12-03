import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
// 🔴 REQUIRED: Import HttpParams for query parameters
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SalesRecord, Customer, SaleItem, PaginatedSalesResponse } from './sales-data';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of, throwError } from 'rxjs';
import { faEdit, faSearch } from '@fortawesome/free-solid-svg-icons';
import { catchError, switchMap, tap, finalize, map } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';


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
  faEdit = faEdit;
  faSearch = faSearch;

  // Sales Filtering Properties
  public searchText: string = '';
  // 🔴 REMOVED: allSalesRecords (No longer needed for server-side loading)
  public salesRecords: SalesRecord[] = [];
  public selectedFilter: string = 'all';

  // Pagination Properties (Server-Side)
  public totalRecords: number = 0;
  public currentPage: number = 1;
  public itemsPerPage: number = 10;
  public nextUrl: string | null = null;
  public previousUrl: string | null = null;
  // 🔴 Added for UI, calculated via getter
  public maxPagesToShow: number = 5;

  // Sale Submission Properties
  public customerForm!: FormGroup;
  public paymentForm!: FormGroup;
  saleForm: FormGroup;
  currentSale: SalesRecord | null = null;

  public submissionLoading = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);
  public backendCustomerId = signal<string | null>(null);
  public currentStage = signal<number>(2);

  // Placeholder functions (kept for compilation)
  public cartItems = () => [{ product_specification_id: 1, quantity: 1, unit_price: 10.00, unit_measure: 'pc' }];
  public resetComponent = () => {};

  readonly SALES_RECORD_API = 'http://127.0.0.1:8000/api/sales/sales-records/';

  @ViewChild('content') content!: ElementRef;
  constructor(private fb: FormBuilder, private http: HttpClient, private modalService: NgbModal) {
    // Form initialization remains the same
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

    this.saleForm = this.fb.group({
        status: ['', Validators.required],
        payment_method: ['', Validators.required],
        payment_status: ['', Validators.required],
        customer_first_name: [''],
        customer_last_name: [''],
        customer_phone_number: [''],
        customer_email: [''],
        items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // 🔴 Start by loading the first page of data
    this.loadSalesRecords();
  }

  /** * 🔴 CORE FUNCTION: Fetches data from the backend based on current filters and page.
   */
  loadSalesRecords(): void {
    let params = new HttpParams()
      // 🔴 Pass page and page_size for server-side pagination
      .set('page', this.currentPage.toString())
      .set('page_size', this.itemsPerPage.toString());

    // 🔴 Pass search term for server-side text filtering
    if (this.searchText.length > 0) {
      params = params.set('search', this.searchText);
    }

    // 🔴 Pass date filter for server-side date filtering
    if (this.selectedFilter !== 'all') {
      params = params.set('filter_by', this.selectedFilter);
    }

    this.http.get<PaginatedSalesResponse>(this.SALES_RECORD_API, { params: params })
      .subscribe({
        next: (res) => {
          this.salesRecords = res.results;
          this.totalRecords = res.count;
          this.nextUrl = res.next;
          this.previousUrl = res.previous;
        },
        error: (err) => {
          console.error("Failed to load sales records:", err);
          this.salesRecords = [];
          this.totalRecords = 0;
        }
      });
  }

  // 🔴 Pagination and Filter Handlers
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadSalesRecords(); // Triggers new API call
    }
  }

  onFilterChange(): void {
    // 🔴 Reset to page 1 on filter change
    this.currentPage = 1;
    this.loadSalesRecords(); // Triggers new API call with new filter
  }

  onSearchChange(): void {
    // 🔴 Reset to page 1 on search change
    this.currentPage = 1;
    this.loadSalesRecords(); // Triggers new API call with new search term
  }

  // 🔴 Getter to calculate total pages for UI
  get totalPages(): number {
      return Math.ceil(this.totalRecords / this.itemsPerPage);
  }

  // 🔴 Getter for page links array (e.g., [1, 2, 3])
  get pageNumbers(): number[] {
        const pages = [];
        const startPage = Math.max(1, this.currentPage - Math.floor(this.maxPagesToShow / 2));
        const endPage = Math.min(this.totalPages, startPage + this.maxPagesToShow - 1);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    }


  // === Form Methods (Unchanged, but kept for completeness) ===
 
  get saleItemsFormArray(): FormArray {
      return this.saleForm.get('items') as FormArray;
  }

  calculateSubtotal(item: any): number {
      const quantity = item.quantity || 0;
      const price = parseFloat(item.unit_price) || 0;
      return quantity * price;
  }

  calculateGrandTotal(): number {
      if (!this.saleItemsFormArray) return 0;
      let total = 0;
      this.saleItemsFormArray.controls.forEach((control: AbstractControl) => {
          const itemValue = control.value;
          total += this.calculateSubtotal(itemValue);
      });
      return total;
  }

  onSaveSale() {
      if (this.saleForm.invalid || !this.currentSale) {
          this.saleForm.markAllAsTouched();
          return;
      }

      const formValues = this.saleForm.value;

      const updatedSalePayload = {
          id: this.currentSale.id,
          status: formValues.status,
          payment_method: formValues.payment_method,
          payment_status: formValues.payment_status,
          total_amount: this.calculateGrandTotal().toFixed(2),

          customer: {
              id: this.currentSale.customer?.id,
              first_name: formValues.customer_first_name,
              last_name: formValues.customer_last_name,
              phone_number: formValues.customer_phone_number,
              email: formValues.customer_email,
          },

          items: formValues.items.map((item: any) => ({
              id: item.id,
              product_specification_id: item.product_specification,
              quantity: item.quantity,
              unit_price: parseFloat(item.unit_price).toFixed(2),
          }))
      };


      this.http.put<SalesRecord>(`${this.SALES_RECORD_API}${updatedSalePayload.id}/`, updatedSalePayload).subscribe({
          next: (response) => {
              this.loadSalesRecords(); // 🔴 Reload the current page to reflect changes
              this.modalService.dismissAll();
          },
          error: (err) => {
              console.error('API Error: Failed to update sale.', err);
          }
      });
  }

  private createItemFormGroup(item: SaleItem): FormGroup {
      return this.fb.group({
          id: [item.id],
          product_specification: [item.product_specification],
          product_sku: [item.product_sku],
          product_name: [item.product_name],
          unit_measure: [item.unit_measure],
          model: [item.model],

          quantity: [item.quantity, [Validators.required, Validators.min(1)]],
          unit_price: [parseFloat(item.unit_price), [Validators.required, Validators.min(0)]],
      });
  }

  openEditModal(sale: SalesRecord) {
      this.currentSale = sale;
      const customer = sale.customer || {
          id: '', first_name: '', last_name: '', email: '', phone_number: ''
      };

      this.saleForm.patchValue({
          status: sale.status,
          payment_method: sale.payment_method,
          payment_status: sale.payment_status,
          customer_first_name: customer.first_name,
          customer_last_name: customer.last_name,
          customer_phone_number: customer.phone_number,
          customer_email: customer.email
      });

      const itemsArray = this.saleItemsFormArray;
      itemsArray.clear();

      sale.items.forEach(item => {
          itemsArray.push(this.createItemFormGroup(item));
      });

      this.modalService.open(this.content, {
          ariaLabelledBy: 'modal-basic-title',
          size: 'lg',
          scrollable: true
      });
  }

  // 🔴 REMOVED: isSameDay, isSameWeek, loadAll
}
