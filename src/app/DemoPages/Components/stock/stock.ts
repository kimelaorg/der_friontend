import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { faStar, faPlus, faEdit, faTrash, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { ActionButton } from '../../../Layout/Components/page-title/page-title.component';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, finalize } from 'rxjs/operators';
import { Inventory } from './inventory';
import { InventoryItem, Location, Product } from './data';


// Interface to represent items that can be selected in the Typeahead
interface SelectableItem {
  id: number;
  model?: string; // Used by Product
  name?: string;  // Used by Location
}


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
  products: Product[] = [];
  locations: Location[] = [];
  inventoryItems: any[] = [];
  data = '';
  selectedInventoryItem: any | null = null;
  public apiErrors: any = {};

  // Forms based on DRF Serializers
  safetyStockForm: FormGroup;
  adjustmentForm: FormGroup;
  inventoryForm: FormGroup;

  // UI State
  loading = true;
 
  // 💡 FIX 1: Formatter functions to display object properties (model/name)
  // This ensures the user sees the model/name while the form control holds the object.
  public formatter = (item: SelectableItem | string): string => {
    // If the item is already a string (e.g., manual input or initial value), return it.
    if (typeof item === 'string') {
      return item;
    }
    // If the item is the selected object, return the model or name for display.
    if (item && item.model) {
      return item.model; // For Product: Model No. seen by the user
    }
    if (item && item.name) {
      return item.name; // For Location: Name seen by the user
    }
    return '';
  };

  public inputFormatter = (item: SelectableItem | string): string => {
    return this.formatter(item);
  };

  stockItem: {
    product: number;
    quantity_in_stock: number;
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

      'product': new FormControl('', [
        Validators.required
      ]),
      'quantity_in_stock': new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      'safety_stock_level': new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),

      'location': new FormControl('', [
        Validators.required
      ])
    });

    this.stockItem = this.inventoryForm.value;
  }


  ngOnInit(): void {
    this.loadProductsList();
    this.loadlocationsList();
    this.loadInventoryList();
  }

  // 💡 FIX 3: Submission logic to extract the ID from the selected object
  onSubmit() {
    if (this.inventoryForm.valid) {

      const formData = this.inventoryForm.value;
      let apiCall: Observable<InventoryItem>;

      // Safely extract IDs from the selected product and location objects
      const productValue = formData.product;
      const locationValue = formData.location;
     
      // If the form value is an object (selected from typeahead), use its ID.
      const productId = typeof productValue === 'object' && productValue !== null
                        ? productValue.id
                        : productValue;

      const locationId = typeof locationValue === 'object' && locationValue !== null
                         ? locationValue.id
                         : locationValue;


      if (this.isEditing) {
        const itemToUpdate: InventoryItem = {
          id: this.currentItem.id,
          product: productId, // Submits ID to DRF
          quantity_in_stock: formData.quantity_in_stock,
          safety_stock_level: formData.safety_stock_level,
          location: locationId // Submits ID to DRF
        };
        apiCall = this.inventoryService.updateStockValue(itemToUpdate);
      } else {
        const itemToAdd = {
          product: productId, // Submits ID to DRF
          quantity_in_stock: formData.quantity_in_stock,
          safety_stock_level: formData.safety_stock_level,
          location: locationId // Submits ID to DRF
        };
        apiCall = this.inventoryService.addStockValue(itemToAdd as Omit<InventoryItem, 'id'>);
      }

      // 💡 FIX 4: Integrated API Subscription and replaced alert()
      apiCall.subscribe({
        next: (response: InventoryItem) => {
          const action = this.isEditing ? 'updated' : 'added';
          // Use console log or a notification service (like Snackbar) instead of alert
          console.log(`SUCCESS: Stock value successfully ${action}!`, response);
          this.loadInventoryList();
          this.modalService.dismissAll();

          this.inventoryForm.reset({
            product: '',
            quantity_in_stock: 0,
            safety_stock_level: 0,
            location: ''
          });
        },
error: (error: any) => {
          console.error('Submission failed:', error);

          // 💡 FIX: Handle specific DRF 400 Bad Request errors
          if (error.status === 400 && error.error) {

            // 1. Check for specific field errors (e.g., "product" field error)
            const fieldErrors = error.error;
            Object.keys(fieldErrors).forEach(key => {
              const control = this.inventoryForm.get(key);
              if (control) {
                // Set a custom validation error on the control for display near the input
                control.setErrors({ apiError: fieldErrors[key] });
              } else {
                // If the error isn't tied to a control (e.g., non_field_errors), store it
                this.apiErrors[key] = fieldErrors[key];
              }
            });
          } else {
            // Handle other types of errors (500, connectivity, etc.)
            this.apiErrors.general = ['An unexpected error occurred. Please try again.'];
          }
        }
      });

    } else {
      console.error('Form is invalid! Please check the fields.');
      this.inventoryForm.markAllAsTouched();
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

  // 💡 FIX 2: Updated Search functions to return the full object, not just the string name
  searchProduct = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? [] : this.products
        .filter(p => p.model.toLowerCase().indexOf(term.toLowerCase()) > -1)
        .slice(0, 10)
        // Returns the array of full Product objects (includes ID)
      )
    );

  searchLocation = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? [] : this.locations
        .filter(l => l.name.toLowerCase().indexOf(term.toLowerCase()) > -1)
        .slice(0, 10)
        // Returns the array of full Location objects (includes ID)
      )
    );

    openAddModal() {
      this.isEditing = false;
      this.currentItem = this.getNewEmptyItem();
      this.inventoryForm.reset();
      this.modalService.open(this.content, { ariaLabelledBy: 'modal-basic-title' });
    }

    openEditModal(item: InventoryItem) {
      this.isEditing = true;
      this.currentItem = { ...item };

      // Look up the full Product/Location object using the ID from the item.
      const productId = Number(item.product);
      const locationId = Number(item.location);

      // Now the comparison is number === number
      const productObject = this.products.find(p => p.id === productId);
      const locationObject = this.locations.find(l => l.id === locationId);


      // Patch the inventoryForm with the full objects for display and the correct data types for the others
      this.inventoryForm.patchValue({
        product: productObject || item.product,
        quantity_in_stock: item.quantity_in_stock,
        safety_stock_level: item.safety_stock_level,
        location: locationObject || item.location
      });

      this.modalService.open(this.content, { ariaLabelledBy: 'modal-basic-title' });
    }

    handleCreateModal = () => {
      this.openAddModal();
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
    // Assuming API returns an array of strings (product names)
    this.inventoryService.getProducts().subscribe({
      next: (data: Product[]) => {
        this.products = data;
      },
      error: (err: any) => {
        console.error('Failed to load products:', err);
      }
    });
  }

  loadlocationsList(): void {
    // Assuming API returns an array of strings (location names)
    this.inventoryService.getLocations().subscribe({
      next: (data: Location[]) => {
        this.locations = data;
      },
      error: (err: any) => {
        console.error('Failed to load locations:', err);
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
        console.log('Safety stock and location updated successfully!');
        this.loadInventoryList(); // Refresh list to show changes
        this.selectedInventoryItem = null; // Close edit row
      },
      error: (err) => console.error(`Update failed: ${err.error.detail || 'Server error'}`, err)
    });
  }

  // --- Stock Adjustment Logic (POST to /stock-adjustment/) ---

  submitAdjustment(): void {
    if (this.adjustmentForm.invalid) return;

    this.inventoryService.submitStockAdjustment(this.adjustmentForm.value).subscribe({
      next: (response) => {
        console.log(`Stock adjustment recorded successfully! Movement ID: ${response.id}`);
        this.adjustmentForm.reset({ unit_cost: 0.00 }); // Reset form
        this.loadInventoryList(); // Refresh inventory status after transaction
      },
      error: (err) => {
        // Display backend validation error (e.g., insufficient stock check)
        const errorMsg = err.error.adjustment_quantity || err.error.product_sku || err.error.detail || 'Server error';
        console.error(`Adjustment failed: ${errorMsg}`, err);
      }
    });
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
