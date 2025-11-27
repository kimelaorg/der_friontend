import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { faStar, faPlus, faEdit, faTrash, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { ActionButton } from '../../../Layout/Components/page-title/page-title.component';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Inventory } from './inventory';
import { InventoryItem } from './data';
import { Test } from '../../../test/test';

@Component({
  selector: 'app-stock',
  standalone: false,
  templateUrl: './stock.html',
  styleUrl: './stock.scss',
})
export class Stock implements OnInit {

  heading = 'Stock Management';
  subheading = 'Stock adjastment & settings';
  icon = 'pe-7s-box2 text-warning';
  currentJustify = 'start';
  isEditing = false;

  currentItem: InventoryItem = this.getNewEmptyItem();

  // Data State
  products: any[] = [];
  locations: any[] = [];
  inventoryItems: any[] = [];
  data = '';
  selectedInventoryItem: any | null = null;

  // Forms based on DRF Serializers
  safetyStockForm: FormGroup;
  adjustmentForm: FormGroup;

  // UI State
  loading = true;
  public formatter = (value: string): string => value;
  public inputFormatter = (value: string): string => value;

  stockItem: {
    product: number;
    quantity_in_stock: number; // Note: TypeScript `number` is a double-precision float, suitable for large numbers up to 2^53.
    safety_stock_level: number;
    location: number;
  };

  // ASSUMPTION: Inject FormBuilder and a service for API calls
  @ViewChild('content') content!: ElementRef;
  constructor(private fb: FormBuilder, private inventoryService: Inventory, private modalService: NgbModal) {

    // --- 1. Form for InventorySerializer (Safety Stock / Location Update) ---
    this.safetyStockForm = this.fb.group({
      id: [null],
      safety_stock_level: [5, [Validators.required, Validators.min(0)]],
      location: [null, [Validators.required]] // Foreign key ID
    });

    // --- 2. Form for StockAdjustmentSerializer (Transactional Logic) ---
    this.adjustmentForm = this.fb.group({
      product_sku: ['', Validators.required],
      // Allow positive (restock) or negative (removal) integers
      adjustment_quantity: [null, [Validators.required, Validators.pattern(/^-?\d+$/)]],
      unit_cost: [0.00, [Validators.min(0)]],
      reason: ['', Validators.required]
    });

    this.inventoryForm = new FormGroup({
      'product': new FormControl(0, [
        Validators.required,
        Validators.min(1)
      ]),
      'quantity_in_stock': new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),

      'safety_stock_level': new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),

      'location': new FormControl(0, [
        Validators.required,
        Validators.min(1)
      ])
    });

    this.stockItem = this.inventoryForm.value;
  }

  inventoryForm: FormGroup;

  ngOnInit(): void {
    this.loadInventoryList();
  }

onSubmit() {
  if (this.inventoryForm.valid) {
    const formData = this.inventoryForm.value;

    // this.inventoryService.addItem(formData).subscribe(
    //   {next: (response) => {
    //     this.inventoryItems = response;
    //   }
    // })

    this.inventoryForm.reset({
      product: 0,
      quantity_in_stock: 0,
      safety_stock_level: 0,
      location: 0
    });
  } else {
    console.error('Form is invalid! Please check the fields.');
  }
}

  getNewEmptyItem(): InventoryItem {
    return {
      id: 0,
      product: '',
      quantity_in_stock: 0,
      safety_stock_level: 0,
      location: ''
    };
  }

  searchProduct = (text$: Observable<string>) =>
    text$.pipe(

      debounceTime(200),

      distinctUntilChanged(),

      map(term => term.length < 2 ? [] : this.products.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    );


  searchLocation = (text$: Observable<string>) =>
    text$.pipe(

      debounceTime(200),

      distinctUntilChanged(),

      map(term => term.length < 2 ? [] : this.locations.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    );

  openAddModal() {
    this.isEditing = false;
    this.currentItem = this.getNewEmptyItem();
    this.modalService.open(this.content, { ariaLabelledBy: 'modal-basic-title' });
  }

  openEditModal(item: InventoryItem) {
    this.isEditing = true;
    this.currentItem = { ...item };
    this.modalService.open(this.content, { ariaLabelledBy: 'modal-basic-title' });
  }

  loadInventoryList(): void {
    this.inventoryService.getInventoryList().subscribe({
      next: data => {
        this.inventoryItems = data;
        this.loading = false;
      },
      error: err => {
        console.error('Failed to load inventory:', err);
        this.loading = false;
        // Handle error display
      }
    });
  }

  loadProductsList(): void {
    this.inventoryService.getProducts().subscribe({
      next: data => {
        this.products = data;
        this.loading = false;
      },
      error: err => {
        console.error('Failed to load inventory:', err);
        this.loading = false;
        // Handle error display
      }
    });
  }

  loadlocationsList(): void {
    this.inventoryService.getLocations().subscribe({
      next: data => {
        this.locations = data;
        this.loading = false;
      },
      error: err => {
        console.error('Failed to load inventory:', err);
        this.loading = false;
        // Handle error display
      }
    });
  }

  // --- Inventory Status Update Logic (PATCH to /inventory/ID/) ---

  selectItemForUpdate(item: any): void {
    this.selectedInventoryItem = item;
    // Patch form with current values for editing
    this.safetyStockForm.patchValue({
      id: item.id,
      safety_stock_level: item.safety_stock_level,
      location: item.location
    });
  }

  updateSafetyStock(): void {
    if (this.safetyStockForm.invalid) return;
    const itemId = this.safetyStockForm.get('id')?.value;
    // Only send the fields that can be updated based on your serializer's read_only_fields
    const payload = {
      safety_stock_level: this.safetyStockForm.value.safety_stock_level,
      location: this.safetyStockForm.value.location
    };

    this.inventoryService.updateInventoryItem(itemId, payload).subscribe({
      next: () => {
        alert('Safety stock and location updated successfully!');
        this.loadInventoryList(); // Refresh list to show changes
        this.selectedInventoryItem = null; // Close edit row
      },
      error: (err) => alert(`Update failed: ${err.error.detail || 'Server error'}`)
    });
  }

  // --- Stock Adjustment Logic (POST to /stock-adjustment/) ---

  submitAdjustment(): void {
    if (this.adjustmentForm.invalid) return;

    this.inventoryService.submitStockAdjustment(this.adjustmentForm.value).subscribe({
      next: (response) => {
        alert(`Stock adjustment recorded successfully! Movement ID: ${response.id}`);
        this.adjustmentForm.reset({ unit_cost: 0.00 }); // Reset form
        this.loadInventoryList(); // Refresh inventory status after transaction
      },
      error: (err) => {
        // Display backend validation error (e.g., insufficient stock check)
        const errorMsg = err.error.adjustment_quantity || err.error.product_sku || err.error.detail || 'Server error';
        alert(`Adjustment failed: ${errorMsg}`);
      }
    });
  }

  handleCreateModal = () => {
      this.openAddModal();
      // this.loadInitialData();
  }

  actionButtons: ActionButton[] = [
      {
          text: 'Add Stock Value',
          icon: faPlus,
          class: 'btn-success',
          onClick: this.handleCreateModal
      }
  ];


}
