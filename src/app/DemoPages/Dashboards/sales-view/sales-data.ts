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
  model: string;
  quantity: number;
  unit_price: string;
  unit_measure: string;
}

export interface SalesRecord {
  id: number;
  sale_date: string;
  total_amount: string;
  status: string;
  payment_method: string;
  payment_status: string;
  sales_outlet: number;
  sales_outlet_name: string;
  sales_agent: string;
  sales_agent_name: string;
  customer: Customer;
  items: SaleItem[];
}
