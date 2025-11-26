import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { debounceTime, switchMap, catchError, finalize, tap, map } from 'rxjs/operators';


// --- API Endpoints ---
const API_BASE = 'http://127.0.0.1:8000/api';
const PRODUCT_SPEC_API = `${API_BASE}/products/specs/`;
const SALES_RECORD_API = `${API_BASE}/sales/sales-records/`;
const CUSTOMER_CREATE_API = `${API_BASE}/sales/customers/`;

// --- Interfaces for type safety (Updated to match API response) ---

interface ProductSpecification {
  id: number; // API response key for the spec ID
  sale_price: string; // API response key for the price

  name: string;
  sku: string;
  unit_measure?: string; // Optional if not always present in API response
}

interface CartItem {
  // These keys must match the final Sales Record API payload fields
  product_specification_id: number;
  quantity: number;
  unit_price: string;
  unit_measure: string;

  // UI fields
  name: string;
  sku: string;
  subtotal: number;
}

interface CustomerData {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
}


@Component({
  selector: 'app-sales',
  standalone: false,
  templateUrl: './sales.html',
  styleUrl: './sales.scss',
})
export class Sales implements OnInit {

  heading = 'Sales Overview';
  subheading = 'Manage Daily Sales';
  icon = 'pe-7s-cash text-success';

  // --- State Management ---
  currentStage = signal(1);
  stages = ['Customer Details', 'Add Items', 'Payment', 'Review & Complete'];

  // Data signals
  cartItems = signal<CartItem[]>([]);
  backendCustomerId = signal<string | null>(null);

  // UI States
  autocompleteResults: ProductSpecification[] = [];
  submissionLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // --- Form Groups ---
  customerForm!: FormGroup;
  salesForm!: FormGroup;
  paymentForm!: FormGroup;

  // --- Computed Values (Calculations) ---
  subTotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.subtotal, 0)
  );
  totalItems = computed(() => this.cartItems().length);

  // --- Constructor ---
  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeForms();
    this.setupAutocomplete();
  }

  initializeForms(): void {
    this.customerForm = this.fb.group({
      first_name: ['', Validators.minLength(2)],
      last_name: ['', Validators.minLength(2)],
      email: ['', Validators.minLength(2)],
      phone_number: ['', [Validators.minLength(8), Validators.maxLength(15)]],
    });

    this.salesForm = this.fb.group({
      searchQuery: new FormControl('', Validators.required),
      quantity: [1, [Validators.required, Validators.min(1)]]
    });

    this.paymentForm = this.fb.group({
      payment_method: ['CASH', Validators.required],
      payment_status: ['Completed', Validators.required],
    });
  }

  // --- Stage 1: Customer Details ---

  submitNewCustomer(): void {
    const customerData = this.customerForm.value;
    const isFilled = customerData.first_name || customerData.last_name || customerData.phone_number || customerData.email;

    if (isFilled && this.customerForm.valid) {
      this.nextStage();
    } else {
      this.skipCustomer();
    }
  }

  skipCustomer(): void {
    this.backendCustomerId.set(null);
    this.customerForm.reset();
    this.nextStage();
  }

  // --- Stage 2: Sales/Items ---

  setupAutocomplete(): void {
    this.salesForm.get('searchQuery')?.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(query => this.searchProducts(query)),
        catchError(error => {
          console.error('Autocomplete API error:', error);
          this.autocompleteResults = [];
          return of([]);
        })
      )
      .subscribe(results => {
        this.autocompleteResults = results;
      });
  }

  searchProducts(query: string): Observable<ProductSpecification[]> {
    if (!query) return of([]);
    return this.http.get<ProductSpecification[]>(PRODUCT_SPEC_API, {
      params: { search: query }
    });
  }

  selectProduct(product: ProductSpecification): void {
    console.log('Product selected from API:', product);

    const quantity = this.salesForm.get('quantity')?.value || 1;
    this.addItemToCart(product, quantity);

    this.salesForm.reset({ searchQuery: '', quantity: 1 });
    this.autocompleteResults = [];
  }

  addItemToCart(product: ProductSpecification, quantity: number): void {
    if (quantity < 1) return;

    // Using API key 'sale_price' for price
    const priceString = product.sale_price;
    const unitPrice = parseFloat(priceString);

    // Validation for API fields
    if (isNaN(unitPrice) || !product.id) {
        this.errorMessage.set(`Invalid product data: Price is ${priceString} or ID is missing.`);
        console.error('Failed to add item due to invalid data:', product);
        return;
    }

    const newItem: CartItem = {
      // MAPPING API FIELDS (id, sale_price) to PAYLOAD FIELDS (product_specification_id, unit_price)
      product_specification_id: Number(product.id),
      quantity: quantity,
      unit_price: priceString, // Send as string as required by "05." example
      unit_measure: product.unit_measure || 'UNIT',

      // UI fields
      name: product.name || 'Unknown Product',
      sku: product.sku || 'N/A',
      subtotal: quantity * unitPrice // For UI calculations
    };

    console.log('Cart Item added:', newItem);
    this.cartItems.update(items => [...items, newItem]);
  }

  updateItemQuantity(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const newQuantity = parseInt(inputElement.value, 10);

    if (newQuantity < 1 || isNaN(newQuantity)) {
      inputElement.value = String(this.cartItems()[index].quantity);
      return;
    }

    this.cartItems.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      const unitPrice = parseFloat(item.unit_price);

      item.quantity = newQuantity;
      item.subtotal = newQuantity * unitPrice;

      return updatedItems;
    });
  }

  removeItem(index: number): void {
    this.cartItems.update(items =>
      items.filter((_, i) => i !== index)
    );
  }

  // --- Stage 4: Execution (Delayed API Calls) ---

  private createCustomerIfNecessary(): Observable<string | null> {
    const customerData = this.customerForm.value;
    const customerFilled = customerData.first_name || customerData.last_name || customerData.phone_number || customerData.email;

    if (!customerFilled || this.customerForm.invalid) {
        return of(null);
    }

    return this.http.post<{ id: string }>(CUSTOMER_CREATE_API, customerData)
        .pipe(
            tap(response => console.log('Customer Retrieved/Created ID:', response.id)),

            // --- FIX: Use 'map' to transform the response object to the ID string ---
            map(response => response.id),
            // -----------------------------------------------------------------------

            // Note: The catchError logic below should use throwError to halt the process,
            // as you previously requested. I've used the corrected version here.
            catchError(err => {
                console.error('Customer lookup/creation failed:', err);

                const backendError = err.error;
                let errorMsg = 'Failed to process customer.';

                if (typeof backendError === 'object' && backendError !== null) {
                    const firstKey = Object.keys(backendError)[0];
                    if (firstKey && Array.isArray(backendError[firstKey])) {
                        errorMsg = `${firstKey}: ${backendError[firstKey].join(', ')}`;
                    } else {
                        errorMsg = JSON.stringify(backendError);
                    }
                } else if (err.message) {
                    errorMsg = err.message;
                }

                this.errorMessage.set(errorMsg);
                return throwError(() => new Error(errorMsg));
            })
        );
}

  private buildPayload(customer_id: string | null): any {

      const paymentData = this.paymentForm.value;

      if (this.cartItems().length === 0) {
          throw new Error("Cannot build payload: Cart is empty.");
      }

      const itemsPayload = this.cartItems().map(item => ({
          // These fields are correctly named for the backend:
          product_specification_id: item.product_specification_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_measure: item.unit_measure,
      }));

      const finalPayload = {

          customer_id: customer_id,
          sales_outlet: null,
          payment_method: paymentData.payment_method,
          payment_status: paymentData.payment_status,
          items: itemsPayload
      };

      console.log('FINAL PAYLOAD TO SALES API:', finalPayload);

      return finalPayload;
  }

  private postSaleRecord(customer_id: string | null): Observable<any> {
      try {
          const payload = this.buildPayload(customer_id);
          return this.http.post<any>(SALES_RECORD_API, payload);
      } catch (e: any) {
          this.errorMessage.set(e.message);
          return of(null);
      }
  }

  completeSale(): void {
      // === FIX: Guard clause to prevent duplicate submissions (race condition) ===
      if (this.submissionLoading()) {
          console.warn('Sale submission already in progress. Ignoring duplicate click.');
          return;
      }
      // ===============================================

      if (this.cartItems().length === 0) {
          this.errorMessage.set("Cannot complete sale: The cart is empty.");
          this.currentStage.set(2);
          return;
      }
      if (this.paymentForm.invalid) {
          this.errorMessage.set("Cannot complete sale: Payment details are incomplete.");
          this.paymentForm.markAllAsTouched();
          this.currentStage.set(3);
          return;
      }

      this.submissionLoading.set(true);
      this.successMessage.set(null);
      this.errorMessage.set(null);

      this.createCustomerIfNecessary()
          .pipe(
              switchMap(customer_id => {
                  // This block is skipped if createCustomerIfNecessary threw an error
                  this.backendCustomerId.set(customer_id);
                  return this.postSaleRecord(customer_id);
              }),
              finalize(() => this.submissionLoading.set(false)),
              catchError(err => {
                  console.error('Sale Submission Failed (or Customer Step Error):', err);

                  // If the error came from createCustomerIfNecessary, the error message is already set.
                  // If the error came from postSaleRecord:
                  if (!this.errorMessage()) {
                      let apiErrorMessage = 'Server error during sale record.';

                      // Check if err.error is a valid object and has an 'items' array
                      if (err.error && err.error.items && err.error.items.length > 0) {
                          // Extract the specific error string from the first item in the array
                          apiErrorMessage = err.error.items[0];
                      } else if (err.error) {
                          // Fallback for other potential errors in err.error
                          apiErrorMessage = JSON.stringify(err.error);
                      }
                      this.errorMessage.set(apiErrorMessage);
                  }

                  // Ensures the Observable chain terminates gracefully without a response
                  return of(null);
              })
          )
          .subscribe(response => {
              if (response) {
                  const transactionId = response.id || 'N/A';
                  this.successMessage.set(transactionId);
                  this.resetComponent();
              }
              // No need for an else block here, as the catchError handles the display of the error
          });
  }

  // --- Navigation/Utility ---

  nextStage(): void {
    this.errorMessage.set(null);

    if (this.currentStage() === 2 && this.cartItems().length === 0) {
      this.errorMessage.set('You must add at least one item to the cart.');
      return;
    } else if (this.currentStage() === 3 && this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.errorMessage.set('Please fill out all required payment details.');
      return;
    }

    this.currentStage.update(stage => Math.min(stage + 1, this.stages.length));
  }

  prevStage(): void {
    this.currentStage.update(stage => Math.max(stage - 1, 1));
    this.errorMessage.set(null);
  }

  goToStage(stage: number): void {
    if (stage < this.currentStage()) {
      this.currentStage.set(stage);
      this.errorMessage.set(null);
    }
  }

  resetComponent(): void {
    this.currentStage.set(1);
    this.cartItems.set([]);
    this.backendCustomerId.set(null);
    this.customerForm.reset();
    this.salesForm.reset({ quantity: 1, searchQuery: '' });
    this.paymentForm.reset({ payment_method: 'CASH', payment_status: 'Completed' });
  }
}
