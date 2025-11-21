// src/app/models/sale.model.ts

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

export interface SaleItem {
  id: number;
  product_specification: number;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: string; // Use string for currency amounts to prevent precision issues
  unit_measure: string;
}

export interface SaleRecord {
  id: number;
  sale_date: string;
  total_amount: string; // Use string for currency amounts
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  payment_method: 'CASH' | 'CARD' | 'TRANSFER';
  payment_status: 'PENDING' | 'PAID';
  sales_outlet: number;
  sales_outlet_name: string;
  sales_agent: string;
  sales_agent_name: string;
  customer: Customer;
  items: SaleItem[];
}
