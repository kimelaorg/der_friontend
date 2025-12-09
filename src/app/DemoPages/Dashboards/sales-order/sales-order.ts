import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, of } from 'rxjs';
import { faTrash, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

// --- Placeholder Interfaces (Adjust these based on your API) ---
interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
}

interface Product {
    id: number;
    product_name: string;
    model: string;
    sku: string;
    discounted_price: number;
}

interface CartItem {
    id: number;
    name: string;
    model: string;
    sku: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product_specification_id: number;
}

interface LocationName {
    id: number;
    name: string;
}

interface ShippingMethod {
    id: number;
    name: string;
    base_cost: number;
}

// --- Placeholder API Base (Replace with your actual base URL) ---
const API_BASE = 'http://127.0.0.1:8000/api';

@Component({
  selector: 'app-sales-order',
  standalone: false,
  templateUrl: './sales-order.html',
  styleUrl: './sales-order.scss',
})
export class SalesOrder implements OnInit, OnDestroy {

  heading = 'Order Management';
  subheading = 'View orders and Create orders on behalf of your customers';
  icon = 'pe-7s-cart icon-gradient bg-happy-itmeo';
  currentJustify = 'center';
  faTrash = faTrash;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient); // Assumes HttpClient is provided

  // --- Component State Signals ---
  stages = ['Customer', 'Items', 'Address', 'Shipping', 'Payment', 'Review'];
  currentStage = signal(1);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  submissionLoading = signal(false);

  // --- Customer Search & Selection State ---
  customerSearchControl = new FormControl('');
  searchResults = signal<Customer[]>([]);
  selectedCustomer = signal<Customer | null>(null);
  finalCustomerId = signal<string | null>(null); // ID of the customer being ordered for

  // --- Forms ---
  customerForm!: FormGroup;
  salesForm!: FormGroup;
  shippingForm!: FormGroup;
  paymentForm!: FormGroup;

  // --- Stage 2 (Items) State ---
  cartItems = signal<CartItem[]>([]);
  autocompleteResults = signal<Product[]>([]);
  private searchSubscription!: Subscription;

  // --- Stage 3 (Address) State ---
  regions = signal<LocationName[]>([]);
  districts = signal<LocationName[]>([]);
  wards = signal<LocationName[]>([]);
  private regionSubscription!: Subscription;
  private districtSubscription!: Subscription;

  // --- Stage 4 (Shipping) State ---
  availableMethods = signal<ShippingMethod[]>([]);

  // --- Computed Signals ---
  totalItems = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));
  subTotal = computed(() => this.cartItems().reduce((sum, item) => sum + item.subtotal, 0));
  selectedMethod = computed(() => {
      const id = this.shippingForm.get('shipping_method_id')?.value;
      return this.availableMethods().find(method => method.id === id) || null;
  });

  constructor() {}

  ngOnInit(): void {
      this.initializeForms();
      this.setupAutocomplete();
      this.setupCustomerSearch();
      this.loadShippingMethods();
      this.loadRegions();
      this.setupLocationCascading();
  }

  ngOnDestroy(): void {
      if (this.searchSubscription) this.searchSubscription.unsubscribe();
      if (this.regionSubscription) this.regionSubscription.unsubscribe();
      if (this.districtSubscription) this.districtSubscription.unsubscribe();
  }

  // #region Initialization and Form Setup
  initializeForms(): void {
      this.customerForm = this.fb.group({
          first_name: ['', Validators.required],
          last_name: ['', Validators.required],
          phone_number: ['', Validators.required],
          email: ['', [Validators.required, Validators.email]],
      });

      this.salesForm = this.fb.group({
          searchQuery: [''],
          quantity: [1, [Validators.required, Validators.min(1)]],
      });

      this.shippingForm = this.fb.group({
          region_name: [null, Validators.required],
          district_name: [null],
          ward_name: [null],
          shipping_method_id: [null, Validators.required],
      });

      this.paymentForm = this.fb.group({
          payment_method: ['CASH', Validators.required],
          payment_status: ['Completed', Validators.required],
      });
  }
  // #endregion

  // #region Stage 1: Customer Search and Submission
  setupCustomerSearch(): void {
      this.customerSearchControl.valueChanges
          .pipe(
              debounceTime(400),
              distinctUntilChanged(),
              switchMap(query => {
                  if (!query || query.length < 2) return of([]);
                  this.searchResults.set([]);
                  return this.http.get<Customer[]>(`${API_BASE}/sales/customer-lookup/?q=${query}`).pipe(
                      catchError(() => of([]))
                  );
              })
          )
          .subscribe(results => this.searchResults.set(results));
  }

  selectExistingCustomer(customer: Customer): void {

    this.selectedCustomer.set(customer);

    // 2. Sets the ID for the final payload.
    this.finalCustomerId.set(customer.id);

    // 3. Clears the dropdown view and updates the input field.
    this.searchResults.set([]);
    this.customerSearchControl.setValue(`${customer.first_name} ${customer.last_name}`, { emitEvent: false });

    // 4. Patches the manual form (optional but recommended).
    this.customerForm.patchValue({
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone_number: customer.phone_number,
        email: customer.email
    });
}

  // selectExistingCustomer(customer: Customer): void {
  //     this.selectedCustomer.set(customer);
  //     this.searchResults.set([]);
  //     this.customerSearchControl.setValue(`${customer.first_name} ${customer.last_name}`, { emitEvent: false });
  //
  //     // Pre-populate manual form for consistency
  //     this.customerForm.patchValue(customer);
  //     this.finalCustomerId.set(customer.id.toString());
  // }

  clearCustomerSelection(): void {
      this.selectedCustomer.set(null);
      this.finalCustomerId.set(null);
      this.customerSearchControl.setValue('', { emitEvent: false });
      this.customerForm.reset();
  }

  placeOrderWithExistingCustomer(): void {
      if (this.selectedCustomer()) {
          this.nextStage();
      }
  }

  submitCustomerStage(): void {
      this.errorMessage.set(null);
      if (this.customerForm.invalid) {
          this.customerForm.markAllAsTouched();
          this.errorMessage.set('Please fill out all required customer details.');
          return;
      }

      // Logic to CREATE the new customer and retrieve their ID goes here
      // For demo, we just proceed. In a real app, you'd make an HTTP POST here.

      this.nextStage();
  }
  // #endregion

  // #region Stage 2: Items
  setupAutocomplete(): void {
      this.searchSubscription = this.salesForm.get('searchQuery')!.valueChanges
          .pipe(
              debounceTime(300),
              distinctUntilChanged(),
              switchMap(query => {
                  if (!query || query.length < 2) return of([]);
                  return this.http.get<Product[]>(`${API_BASE}/sales/products/specs/?search=${query}`).pipe(
                      catchError(() => of([]))
                  );
              })
          )
          .subscribe(results => this.autocompleteResults.set(results));
  }

  selectProduct(product: Product): void {
      const quantity = this.salesForm.get('quantity')!.value || 1;

      const existingItem = this.cartItems().find(item => item.id === product.id);

      if (existingItem) {
          this.updateItemQuantity(this.cartItems().indexOf(existingItem), { target: { value: existingItem.quantity + quantity } } as any);
      } else {
          const newItem: CartItem = {
              id: product.id,
              name: product.product_name,
              model: product.model,
              sku: product.sku,
              quantity: quantity,
              unit_price: product.discounted_price,
              subtotal: product.discounted_price * quantity,
              product_specification_id: product.id, // Assuming ID is the specification ID
          };
          this.cartItems.update(items => [...items, newItem]);
      }

      this.salesForm.get('searchQuery')?.setValue('');
      this.autocompleteResults.set([]);
  }

  updateItemQuantity(index: number, event: any): void {
      const newQuantity = Math.max(1, parseInt(event.target.value, 10));
      if (isNaN(newQuantity)) return;

      this.cartItems.update(items => {
          const updatedItems = [...items];
          const item = updatedItems[index];
          item.quantity = newQuantity;
          item.subtotal = item.unit_price * newQuantity;
          return updatedItems;
      });
  }

  removeItem(index: number): void {
      this.cartItems.update(items => items.filter((_, i) => i !== index));
  }
  // #endregion

  // #region Stage 3 & 4: Location and Shipping Methods
  loadRegions(): void {
      this.http.get<LocationName[]>(`${API_BASE}/auth/locations/`).pipe(
          catchError(() => of([]))
      ).subscribe(regions => this.regions.set(regions));
  }

  loadDistricts(regionName: string): void {
      this.districts.set([]);
      this.shippingForm.get('district_name')?.setValue(null);
      this.wards.set([]);
      this.shippingForm.get('ward_name')?.setValue(null);

      this.http.get<LocationName[]>(`${API_BASE}/auth/locations/?level=districts&region=${regionName}`).pipe(
          catchError(() => of([]))
      ).subscribe(districts => this.districts.set(districts));
  }

  loadWards(districtName: string): void {
      this.wards.set([]);
      this.shippingForm.get('ward_name')?.setValue(null);

      const regionName = this.shippingForm.get('region_name')?.value; // <-- Get selected region

      this.http.get<LocationName[]>(
          `${API_BASE}/auth/locations/?level=wards&region=${regionName}&district=${districtName}`
      ).pipe(
          catchError(() => of([]))
      ).subscribe(wards => this.wards.set(wards));
  }

  setupLocationCascading(): void {
      this.regionSubscription = this.shippingForm.get('region_name')!.valueChanges
          .pipe(distinctUntilChanged())
          .subscribe(regionName => { if (regionName) this.loadDistricts(regionName); });

      this.districtSubscription = this.shippingForm.get('district_name')!.valueChanges
          .pipe(distinctUntilChanged())
          .subscribe(districtName => { if (districtName) this.loadWards(districtName); });
  }

  loadShippingMethods(): void {
      this.http.get<ShippingMethod[]>(`${API_BASE}/setups/shipping-methods/`).pipe(
          catchError(() => of([]))
      ).subscribe(methods => this.availableMethods.set(methods));
  }
  // #endregion

  // #region Navigation and Final Submission
  goToStage(stage: number): void {
      if (stage <= this.currentStage()) {
          this.currentStage.set(stage);
          this.errorMessage.set(null);
      }
  }

  prevStage(): void {
      this.currentStage.update(stage => Math.max(stage - 1, 1));
      this.errorMessage.set(null);
  }

  nextStage(): void {
      this.errorMessage.set(null);
      const current = this.currentStage();

      if (current === 1 && !this.selectedCustomer() && this.customerForm.invalid) {
          this.customerForm.markAllAsTouched();
          this.errorMessage.set('Customer details are required to proceed.');
          return;
      }

      if (current === 2 && this.totalItems() === 0) {
          this.errorMessage.set('Please add at least one item to the cart.');
          return;
      }

      if (current === 3 && this.shippingForm.get('region_name')?.invalid) {
          this.shippingForm.markAllAsTouched();
          this.errorMessage.set('Please select a Shipping Region.');
          return;
      }

      if (current === 4 && this.shippingForm.get('shipping_method_id')?.invalid) {
          this.shippingForm.markAllAsTouched();
          this.errorMessage.set('Please select a Shipping Method.');
          return;
      }

      if (current === 5 && this.paymentForm.invalid) {
          this.paymentForm.markAllAsTouched();
          this.errorMessage.set('Please select valid Payment Method and Status.');
          return;
      }

      this.currentStage.update(stage => Math.min(stage + 1, this.stages.length));
  }

  private buildPayload(): any {
      const customerData = this.customerForm.value;
      const shippingData = this.shippingForm.value;
      const paymentData = this.paymentForm.value;

      const itemsPayload = this.cartItems().map(item => ({
          product: item.product_specification_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
      }));

      const payload = {
          customer: this.finalCustomerId(), // Use selected ID if available
          new_customer_data: this.finalCustomerId() ? undefined : customerData, // Include details only if new customer
          shipping_method: shippingData.shipping_method_id,

          // New address fields are nested for API:
          shipping_address_data: {
              region: shippingData.region_name,
              district: shippingData.district_name,
              ward: shippingData.ward_name,
          },

          payment_method: paymentData.payment_method,
          payment_status: paymentData.payment_status,
          items: itemsPayload,
      };

      return payload;
  }

  completeSale(): void {
      this.submissionLoading.set(true);
      this.errorMessage.set(null);

      const payload = this.buildPayload();
      console.log('Final Payload:', payload);

      // Replace with actual API call (e.g., POST to /api/orders)
      this.http.post<{ order_id: string }>(`${API_BASE}/sales/staff-orders/`, payload)
          .pipe(
              catchError((error) => {
                  this.submissionLoading.set(false);
                  this.errorMessage.set('Order submission failed. Check console for details.');
                  console.error(error);
                  return of(null);
              })
          )
          .subscribe(response => {
              this.submissionLoading.set(false);
              if (response) {
                  this.successMessage.set(response.order_id);
                  this.resetComponent();
              }
          });
  }

  resetComponent(): void {
      this.currentStage.set(1);
      this.cartItems.set([]);
      this.selectedCustomer.set(null);
      this.finalCustomerId.set(null);
      this.customerSearchControl.setValue('');
      this.customerForm.reset();
      this.salesForm.reset({ quantity: 1 });
      this.shippingForm.reset({ shipping_method_id: null, region_name: null });
      this.paymentForm.reset({ payment_method: 'CASH', payment_status: 'Completed' });
      this.districts.set([]);
      this.wards.set([]);
  }
  // #endregion

}
