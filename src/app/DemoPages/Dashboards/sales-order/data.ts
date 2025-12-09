export interface OrderItemCreation {
  product: number; // The product ID (PK)
  quantity: number;
}

export interface OrderCreationPayload {
  customer: number;
  creation_source: 'AGENT';
  shipping_method?: number;
  shipping_address?: number;
  new_physical_items: OrderItemCreation[];
  new_digital_items: OrderItemCreation[];
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  is_digital: boolean; // Crucial for distinguishing item types
}
