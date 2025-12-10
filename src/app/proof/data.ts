// product.interface.ts

export interface ProductImage {
    id: number;
    product: number;
    image: string; // The URL from your backend
}

export interface Product {
  parent_product_name: string;
  parent_category_name: string;
  actual_price: number;
  discounted_price: number;
  model: string;

  stock_quantity: number;
  is_active: boolean;
  images: ProductImage[];
    // ... other properties
}


export interface CartProduct {
    id: number;
    parent_product_name: string;
    parent_category_name: string;
    actual_price: string;
    discounted_price: string;
    // ... other properties
    images: ProductImage[];
    // ... other properties
}

// For the Gallery Component, we'll transform this into a structure that Drift can use
export interface GalleryImage {
    thumb: string;
    large: string;
    zoom: string;
    id: number;
}
