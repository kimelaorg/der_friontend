// For /fulfillment/requests (ShipmentRequest List)
export interface IShipmentRequest {
    id: number;
    order_id: number;
    requested_at: string; // ISO date string
    is_fulfilled: boolean;
    order_customer_name: string; // Assuming you add this field to your DRF serializer
    order_total: number;
    // Add other relevant fields like total weight, customer address summary, etc.
}

// For a single physical order item (used within a detail view)
export interface IOrderItemPhysical {
    id: number;
    product_name: string;
    quantity: number; // Total quantity ordered
    unit_price: number;
    // Add fields to track fulfillment state:
    shipped_quantity?: number; // Quantity already shipped across all past shipments
    remaining_quantity?: number; // quantity - shipped_quantity
}

// For the full order detail tied to the request
export interface IOrderDetails {
    // ... all order fields
    physical_items: IOrderItemPhysical[];
    // ...
}
