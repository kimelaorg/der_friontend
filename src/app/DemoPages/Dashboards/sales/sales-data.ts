export interface ProductSpec {
  id: number;
  sku: string;
  name: string;
  unitPrice: number;
  inventoryStatus: string; // e.g., 'OK', 'LOW_STOCK'
}

export interface LineItem {
  id: number;
  productSpecificationId: number;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
}

export interface SaleItemPayload {
  product_specification_id: number;
  quantity: number;
  unit_price: number;
  unit_measure?: string;
}

export interface SaleTransactionPayload {
  customer_id: number | null;
  sales_outlet: number; // Office location ID
  payment_method: 'CASH' | 'CARD' | 'MOMO' | 'TRANSFER' | 'OTHER';
  payment_status: 'PAID' | 'PENDING';
  items: SaleItemPayload[];
}

export interface SaleResponse {
  id: number;
  total_amount: number;
  sale_date: string;
  sales_agent_name: string;
  items: any[];
}
