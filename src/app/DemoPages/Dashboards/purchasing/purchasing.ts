import { Component, signal, WritableSignal, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl, ReactiveFormsModule, AbstractControl, NonNullableFormBuilder } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap, finalize } from 'rxjs/operators';
import { of, Observable, forkJoin } from 'rxjs';
import { NgbModal, NgbCollapseModule, NgbModule } from '@ng-bootstrap/ng-bootstrap'; // Import NgbModal
import { PurchasingLogics } from './purchasing-logics';
import {
  PurchaseOrder, PurchaseOrderItem, StockReception, Supplier, SupplierData,
  ReceptionRecord, ReceptionPayload, AvailableItemOption
 } from './purchasing-data';


export function minLengthArray(min: number) {
    return (c: AbstractControl): {[key: string]: any} | null => {
        if (c instanceof FormArray) {
            return c.controls.length >= min ? null : { 'minLengthArray': { requiredLength: min, actualLength: c.controls.length } };
        }
        return null;
    };
}

interface SupplierForm {
    phone: FormControl<string>;
    email: FormControl<string>;
    address: FormControl<string>;
    name: FormControl<string>;
}


@Component({
    selector: 'app-purchasing',
    standalone: false,
    templateUrl: './purchasing.html',
    styleUrl: './purchasing.scss',
})
export class Purchasing implements OnInit {

    // --- Component Metadata ---
    heading = '';
    subheading = '';
    icon = 'pe-7s-note2 text-info';
    currentJustify = 'start';

    // --- State Variables ---
    poId: number | null = null;
    mode: 'create-po' | 'edit-po' | 'receive-stock' = 'create-po';
    isLoading = false;
    isSubmitting = false;

    // --- Supplier Modal State ---
    @ViewChild('supplierModal') supplierModal!: ElementRef;
    @ViewChild('deleteSupplierConfirmationModal') deleteSupplierConfirmationModal!: ElementRef;
    supplierModalMode: 'create' | 'edit' = 'create';
    currentSupplierId: number | null = null;
    supplierLoading = signal(false);
    supplierMessage = signal<string | null>(null);

    public handlePreventToggle() {
        // This demonstrates prevention logic - do nothing
    }

    // --- Form & Data Holders ---
    poForm!: FormGroup; // Used for PO Creation/Edit
    srForm!: FormGroup; // Used for Stock Reception Entry
    currentPo: PurchaseOrder | null = null;
    products: any[] = [];

    // Data signal for suppliers - populated by loadSuppliers
    suppliersSignal: WritableSignal<SupplierData[]> = signal([]);
    purchaseOrders: WritableSignal<any[]> = signal([]);
    receptions: WritableSignal<ReceptionRecord[]> = signal([]);
    availableItems: WritableSignal<AvailableItemOption[]> = signal([]);
    isEditMode: WritableSignal<boolean> = signal(false);

    currentReception: WritableSignal<Partial<ReceptionRecord>> = signal({
      purchase_order_item: undefined,
      quantity_received: undefined,
      decayed_products: 0, // Default to 0 as shown in the image
    });

    // Signal to track the currently open accordion panel (its ID)
    activePanel: WritableSignal<string | null> = signal(null);

    private apiUrl = '/api/purchasing/orders/';

    // Injecting the service using the final name: PurchasingLogics
    private baseUrl = 'http://127.0.0.1:8000/api/';
    private supplierUrl = `${this.baseUrl}suppliers/`; // Adjusted to match expected pattern
    private formBuilder = inject(NonNullableFormBuilder);
    http = inject(HttpClient);
    private modalService = inject(NgbModal); // Inject NgbModal

    constructor(
        private fb: FormBuilder,
        private purchasingService: PurchasingLogics,
        private route: ActivatedRoute,
        public router: Router,
    ) {}

    // --- Supplier Form Definition ---
    supplierForm: FormGroup<SupplierForm> = this.formBuilder.group({
        phone: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        name: ['', [Validators.required]],
        address: ['', [Validators.required]],
    });

    ngOnInit(): void {
        this.loadRouteData();
        this.loadSuppliers(); // Load suppliers on component initialization
        this.loadPurchaseOrders();
        this.loadReceptions();

    }

    // --- Data Loading ---


    loadReceptions(): void {
      this.purchasingService.getAllReceptions().subscribe({
        next: (data) => this.receptions.set(data),
        error: (err) => console.error('Failed to load receptions', err)
      });
    }

    openModal(content: any, record?: ReceptionRecord): void {
      if (record) {
        // Edit Mode
        this.isEditMode.set(true);
        // Set the signal to the record data for editing
        this.currentReception.set({ ...record });
      } else {
        // Create Mode
        this.isEditMode.set(false);
        // Reset the signal to default values for creation
        this.currentReception.set({
          purchase_order_item: undefined,
          quantity_received: undefined,
          decayed_products: 0,
        });
      }

      // Open the Ng-Bootstrap modal
      this.modalService.open(content, { centered: true });
    }

    closeModal(): void {
      this.modalService.dismissAll();
    }

    // --- CRUD Actions ---

    saveReception(): void {
      const record = this.currentReception();

      // Simple validation
      if (!record.purchase_order_item || !record.quantity_received) {
        alert('Please select a PO Item and enter Quantity Received.');
        return;
      }

      // Extract payload data
      const payload: ReceptionPayload = {
        purchase_order_item: record.purchase_order_item as number,
        quantity_received: record.quantity_received as number,
        decayed_products: record.decayed_products as number,
      };

      if (this.isEditMode()) {
        // UPDATE
        this.purchasingService.updateReception(record.id as number, payload).subscribe({
          next: () => {
            this.loadReceptions();
            this.closeModal();
          },
          error: (err) => console.error('Failed to update reception', err)
        });
      } else {
        // CREATE
        this.purchasingService.createReception(payload).subscribe({
          next: () => {
            this.loadReceptions();
            this.closeModal();
          },
          error: (err) => console.error('Failed to create reception', err)
        });
      }
    }

    deleteReception(id: number): void {
      if (confirm('Are you sure you want to delete this reception record?')) {
        this.purchasingService.deleteReception(id).subscribe({
          next: () => this.loadReceptions(),
          error: (err) => console.error('Failed to delete reception', err)
        });
      }
    }

  /**
   * Toggles the active accordion panel.
   * Uses the panel ID (e.g., 'panel1', 'panel2') to track state.
   */
  openAccordionPanel(panelId: string): void {
    const currentPanel = this.activePanel();

    if (currentPanel === panelId) {
      // If the currently open panel is clicked, close it
      this.activePanel.set(null);
    } else {
      // Open the new panel
      this.activePanel.set(panelId);
    }
  }

    loadSuppliers(): void {
        this.supplierLoading.set(true);
        this.purchasingService.getSuppliers().pipe(
            finalize(() => this.supplierLoading.set(false))
        ).subscribe({
            next: (data: SupplierData[]) => {
                this.suppliersSignal.set(data);
                // Also update the lookup data used by the PO form
                // this.suppliers = data;
            },
            error: (err) => {
                this.supplierMessage.set('Failed to load suppliers.');
                console.error('Error loading suppliers:', err);
            }
        });
    }

    loadPurchaseOrders(): void {

        this.purchasingService.getPurchaseOrders().pipe(
        ).subscribe({
            next: (data: any[]) => {
                console.log('Purchase Orders loaded successfully:', data);
                this.purchaseOrders.set(data);
                const flatItems = this.extractAvailableItems(data);
                this.availableItems.set(flatItems);
            },
            error: (err) => {
                console.error('Failed to load Purchase Orders:', err);
                // Handle error display here (e.g., set an error message signal)
            }
        });
    }

    extractAvailableItems(orders: PurchaseOrder[]): AvailableItemOption[] {
      const availableList: AvailableItemOption[] = [];

      orders.forEach(po => {
          po.items.forEach(item => {
              // Check if the item is NOT fully received (e.g., received < ordered)
              // NOTE: You may want stricter logic here (e.g., po_status != 'DELIVERED')
              if (item.quantity_received_sum < item.quantity_ordered) {
                availableList.push({
                    id: item.id, // The purchase_order_item ID
                    po_number: po.po_number,
                    display: `${po.po_number} - ${item.product_name} (Qty Left: ${item.quantity_ordered - item.quantity_received_sum})`
                });
              }
          });
      });

      return availableList;
    }

    loadRouteData(): void {
        this.isLoading = true;
        this.route.paramMap.pipe(
            // 1. Determine mode and get PO ID
            switchMap(params => {
                this.poId = Number(params.get('id'));
                const urlSegments = this.router.url.split('/');

                if (isNaN(this.poId) || this.poId === 0) {
                    this.mode = 'create-po';
                    this.setMetadata('Manage Purchase Order Details', 'New stock procurement request.');
                    this.initializePoForm();
                    return of(null);
                } else if (urlSegments.includes('receive')) {
                    this.mode = 'receive-stock';
                    this.setMetadata('Record Stock Reception', `Entry for PO #${this.poId}.`);
                    return this.purchasingService.getPurchaseOrder(this.poId);
                } else {
                    this.mode = 'edit-po';
                    this.setMetadata('Edit Purchase Order', `Modify PO #${this.poId} details.`);
                    return this.purchasingService.getPurchaseOrder(this.poId);
                }
            }),
            // 2. Load supporting data (Suppliers/Products)
            switchMap(poData => {
                if (poData) {
                    this.currentPo = poData;
                }
                // Only load products here, as suppliers are handled by loadSuppliers()
                return this.loadInitialLookupData();
            })
        ).subscribe({
            next: () => {
                if (this.currentPo) {
                    if (this.mode === 'edit-po') {
                        this.initializePoForm(this.currentPo);
                    } else if (this.mode === 'receive-stock') {
                        this.initializeSrForm(this.currentPo);
                    }
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading data:', err);
                this.isLoading = false;
            }
        });
    }

    setMetadata(heading: string, subheading: string): void {
        this.heading = heading;
        this.subheading = subheading;
    }

    loadInitialLookupData(): Observable<[any[]]> {
        // Updated to only fetch products here; suppliers are handled by loadSuppliers
        return forkJoin([
            this.purchasingService.getProducts()
        ]).pipe(
            tap(([productsData]) => {
                this.products = productsData;
            }),
            switchMap(([productsData]) => of([productsData] as [any[]]))
        );
    }

    // --- Supplier CRUD Handlers ---

    handleCreateSupplierModal(): void {
        this.supplierModalMode = 'create';
        this.supplierForm.reset();
        this.supplierMessage.set(null);
        this.modalService.open(this.supplierModal, { centered: true });
    }

    handleEditSupplierModal(supplier: Supplier): void {
        this.supplierModalMode = 'edit';
        this.currentSupplierId = supplier.id!;
        this.supplierMessage.set(null);
        this.supplierForm.patchValue({
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
        });
        this.modalService.open(this.supplierModal, { centered: true });
    }

    handleDeleteSupplierModal(id: number): void {
        this.currentSupplierId = id;
        this.supplierMessage.set(null);
        this.modalService.open(this.deleteSupplierConfirmationModal, { centered: true, size: 'sm' });
    }

    onAddOrEditSupplier(): void {
        this.supplierMessage.set(null);
        this.supplierLoading.set(true);

        if (this.supplierForm.invalid) {
            this.supplierForm.markAllAsTouched();
            this.supplierLoading.set(false);
            return;
        }

        const formValue = this.supplierForm.getRawValue();
        let apiCall: Observable<Supplier>;

        if (this.supplierModalMode === 'create') {
            apiCall = this.purchasingService.createSupplier(formValue as Supplier);
        } else {
            const updatePayload: Supplier = { id: this.currentSupplierId!, ...formValue };
            apiCall = this.purchasingService.updateSupplier(updatePayload);
        }

        apiCall.pipe(
            finalize(() => this.supplierLoading.set(false))
        ).subscribe({
            next: () => {
                this.modalService.dismissAll();
                this.loadSuppliers(); // Reload list after successful operation
            },
            error: err => {
                const errors = err?.error;
                if (errors && typeof errors === 'object') {
                    // Server-side validation handling
                    Object.keys(errors).forEach(field => {
                        const control = this.supplierForm.get(field);
                        if (control) {
                            control.setErrors({ serverError: errors[field][0] });
                        }
                    });
                    this.supplierMessage.set('Server-side validation failed. Check fields.');
                } else {
                    this.supplierMessage.set('An unexpected error occurred. Please try again.');
                    console.error('Unexpected supplier operation error:', err);
                }
            }
        });
    }

    onDeleteSupplier(): void {
        if (!this.currentSupplierId) {
            this.supplierMessage.set('No supplier selected for deletion.');
            return;
        }

        this.supplierLoading.set(true);
        this.purchasingService.deleteSupplier(this.currentSupplierId!).pipe(
            finalize(() => this.supplierLoading.set(false))
        ).subscribe({
            next: () => {
                this.modalService.dismissAll();
                this.loadSuppliers(); // Reload list after successful deletion
            },
            error: (err) => {
                this.supplierMessage.set('Failed to delete supplier. It might be linked to existing data.');
                console.error('Error deleting supplier:', err);
            }
        });
    }

    // --- Form Initialization ---

    initializePoForm(po?: PurchaseOrder): void {
        this.poForm = this.fb.group({
            id: [po?.id || null],
            supplier: [po?.supplier || null, Validators.required],
            expected_delivery_date: [po?.expected_delivery_date || null, Validators.required],
            po_status: [po?.po_status || 'DRAFT'],
            items: this.fb.array(po?.items?.map(item => this.createItemFormGroup(item)) || [], minLengthArray(1))
        });
    }

    initializeSrForm(po: PurchaseOrder): void {
        this.srForm = this.fb.group({
            receptions: this.fb.array(
                po.items.map(item => this.createReceptionFormGroup(item))
            )
        });
    }

    // --- FormArray Management (PO Items) ---

    get poItems(): FormArray {
        return this.poForm?.get('items') as FormArray;
    }

    createItemFormGroup(item?: PurchaseOrderItem): FormGroup {
        return this.fb.group({
            id: [item ? item.id : null],
            // Product is required, starts null, which keeps the line invalid until selected
            product: [item ? item.product : null, Validators.required],
            quantity_ordered: [item ? item.quantity_ordered : 1, [Validators.required, Validators.min(1)]],
            unit_cost: [item ? item.unit_cost : 0.00, [Validators.required, Validators.min(0)]],
            quantity_received_sum: [item?.quantity_received_sum || 0],
            product_name: [item?.product_name || '']
        });
    }

    addItem(): void {
        this.poItems.push(this.createItemFormGroup());
    }

    removeItem(index: number): void {
        this.poItems.removeAt(index);
    }

    // --- FormArray Management (Stock Receptions) ---

    get srItems(): FormArray {
        return this.srForm?.get('receptions') as FormArray;
    }

    createReceptionFormGroup(item: PurchaseOrderItem): FormGroup {
        const maxReceivable = item.quantity_ordered - (item.quantity_received_sum || 0);

        return this.fb.group({
            purchase_order_item: [item.id, Validators.required],
            product_name: [item.product_name],
            quantity_ordered: [item.quantity_ordered],
            quantity_received_sum: [item.quantity_received_sum],
            max_receivable: [maxReceivable],

            quantity_received: [0, [
                Validators.required,
                Validators.min(1),
                Validators.max(maxReceivable)
            ]],
            decayed_products: [0, [Validators.min(0)]],
        });
    }

    // --- Submission Logic (Existing PO/SR) ---

    // PO Creation / Update
    onPoSubmit(): void {
        if (this.poForm.invalid || this.isSubmitting) {
            this.poForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const payload: PurchaseOrder = this.poForm.value;

        const apiCall = this.mode === 'create-po'
            ? this.purchasingService.createPurchaseOrder(payload)
            : this.purchasingService.updatePurchaseOrder(payload);

        apiCall.subscribe({
            next: (response: PurchaseOrder) => {
                this.isSubmitting = false;
                this.router.navigate(['/purchasing', 'edit', response.id]);
            },
            error: (error: any) => {
                this.isSubmitting = false;
                console.error('Error submitting Purchase Order:', error);
            }
        });
    }

    // Stock Reception Submission
    onSrSubmit(): void {
        if (this.srForm.invalid || this.isSubmitting) {
            this.srForm.markAllAsTouched();
            return;
        }

        const receptionsToSubmit: StockReception[] = this.srItems.controls
            .map(control => control.value)
            .filter(val => val.quantity_received > 0);

        if (receptionsToSubmit.length === 0) {
            console.error("No quantity entered for reception.");
            return;
        }

        this.isSubmitting = true;

        let completed = 0;
        receptionsToSubmit.forEach(reception => {
            this.purchasingService.createStockReception(reception).subscribe({
                next: () => {
                    completed++;
                    if (completed === receptionsToSubmit.length) {
                        this.isSubmitting = false;
                        this.router.navigate(['/purchasing', 'edit', this.poId]);
                    }
                },
                error: (error: any) => {
                    this.isSubmitting = false;
                    console.error('Error creating Stock Reception:', error);
                }
            });
        });
    }
}
