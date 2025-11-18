import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Inventory } from './inventory';

@Component({
  selector: 'app-stock',
  standalone: false,
  templateUrl: './stock.html',
  styleUrl: './stock.scss',
})
export class Stock implements OnInit {

  // Data State
  inventoryItems: any[] = []; // List of all inventory items (Use InventoryStatus[] if defined)
  selectedInventoryItem: any | null = null; // Item selected for safety stock/location update

  // Forms based on DRF Serializers
  safetyStockForm: FormGroup;
  adjustmentForm: FormGroup;

  // UI State
  loading = true;

  // ASSUMPTION: Inject FormBuilder and a service for API calls
  constructor(private fb: FormBuilder, private inventoryService: Inventory) {

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
  }

  ngOnInit(): void {
    this.loadInventoryList();
  }

  // --- API / Data Loading ---

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
}
