import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { of, Observable, forkJoin } from 'rxjs';
import { PurchasingLogics } from './purchasing-logics';
import { PurchaseOrder, PurchaseOrderItem, StockReception } from './purchasing-data';


export function minLengthArray(min: number) {
    return (c: AbstractControl): {[key: string]: any} | null => {
        if (c instanceof FormArray) {
            return c.controls.length >= min ? null : { 'minLengthArray': { requiredLength: min, actualLength: c.controls.length } };
        }
        return null;
    };
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

  // --- State Variables ---
  poId: number | null = null;
  mode: 'create-po' | 'edit-po' | 'receive-stock' = 'create-po';
  isLoading = false;
  isSubmitting = false;

  // --- Form & Data Holders ---
  poForm!: FormGroup; // Used for PO Creation/Edit
  srForm!: FormGroup; // Used for Stock Reception Entry
  currentPo: PurchaseOrder | null = null;
  suppliers: any[] = [];
  products: any[] = [];

  // Injecting the service using the final name: PurchasingLogics
  constructor(
    private fb: FormBuilder,
    private purchasingService: PurchasingLogics,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadRouteData();
  }

  // --- Routing and Data Loading ---

  loadRouteData(): void {
    this.isLoading = true;
    this.route.paramMap.pipe(
      // 1. Determine mode and get PO ID
      switchMap(params => {
        this.poId = Number(params.get('id'));
        const urlSegments = this.router.url.split('/');

        if (isNaN(this.poId) || this.poId === 0) {
          this.mode = 'create-po';
          this.setMetadata('Create Purchase Order', 'New stock procurement request.');
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

  loadInitialLookupData(): Observable<[any[], any[]]> {
      return forkJoin([
          this.purchasingService.getSuppliers(),
          this.purchasingService.getProducts()
      ]).pipe(
          tap(([suppliersData, productsData]) => {
              this.suppliers = suppliersData;
              this.products = productsData;
          }),
          switchMap(([suppliersData, productsData]) => of([suppliersData, productsData] as [any[], any[]]))
      );
  }

  // --- Form Initialization ---

  initializePoForm(po?: PurchaseOrder): void {
    this.poForm = this.fb.group({
      id: [po?.id || null],
      supplier: [po?.supplier || null, Validators.required],
      expected_delivery_date: [po?.expected_delivery_date || null, Validators.required],
      po_status: [po?.po_status || 'DRAFT'],
      // 🎯 FIX APPLIED: Use custom validator to require at least one item
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

  // --- Submission Logic ---

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
