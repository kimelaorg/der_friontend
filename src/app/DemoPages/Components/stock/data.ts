// --- 1. InventoryStatus (Based on InventorySerializer) ---
// Represents the status of a single product in a single location.
export interface InventoryStatus {
  id: number;
  product: number; // Product ID (FK to ProductSpecification)
  sku: string; // Read-only from product.sku
  product_name: string; // Read-only from product.product.name

  quantity_in_stock: number; // Read-only from movements
  safety_stock_level: number; // Writable

  location: number; // WarehouseLocation ID (Writable)

  // Nested Location Details (Read-only representation)
  location_details: {
    id: number;
    name: string;
    code: string;
    // ... other location fields
  };

  last_restock_date: string | null; // Read-only
  is_low_stock: boolean; // Read-only (calculated)

  created_at: string;
  updated_at: string;
}


// --- 2. StockAdjustmentPayload (Based on StockAdjustmentSerializer) ---
// Represents the data sent to the transactional stock adjustment endpoint.
export interface StockAdjustmentPayload {
  product_sku: string;
  adjustment_quantity: number; // Positive to add, negative to remove
  unit_cost?: number; // Optional in form, but sent to API
  reason: string;
}


// --- 3. StockMovementResponse (Based on StockMovementSerializer) ---
// Represents the audit record returned after a successful stock adjustment POST.
export interface StockMovementResponse {
  id: number;
  product: number;
  product_sku: string;
  product_name: string;

  movement_type: 'ADJUST' | 'SALE' | 'RECEIPT'; // Or other defined types
  quantity_change: number;
  unit_cost: number;
  reference_id: string; // The reason from the payload

  performed_by: number; // User ID (FK)
  performed_by_name: string; // E.g., phone number or username

  timestamp: string;
}

// --- Utility Interfaces for Update Payloads ---

// The minimal payload needed to update the safety stock or location.
export interface InventoryUpdatePayload {
    safety_stock_level?: number;
    location?: number;
}
