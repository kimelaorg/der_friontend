// src/app/models/product.model.ts

/**
 * Defines the structure for the Electrical Specifications object nested within the Product.
 */
export interface ElectricalSpecs {
  id: number;
  voltage: string;
  max_wattage: string;
  frequency: string;
  product: number; // Foreign key ID of the parent product
}

/**
 * Defines the structure for a Product Image object.
 */
export interface ProductImage {
  id: number;
  product: number; // Foreign key ID of the parent product
  image: string; // The URL/path to the image file (e.g., "jpeg")
}

/**
 * Defines the structure for a Product Video object.
 */
export interface ProductVideo {
  id: number;
  product: number; // Foreign key ID of the parent product
  video: string; // The URL/path to the video file (e.g., "mov")
}

/**
 * Defines the structure for a Connectivity Detail object.
 */
export interface ConnectivityDetail {
  id: number;
  connectivity: number; // ID of the connectivity type
  connectivity_name: string; // e.g., "HDMI", "USB"
  connectivity_count: number; // e.g., 2, 3
}

/**
 * Defines the structure for a User Review object.
 */
export interface UserReview {
  id: number;
  user: string; // Username or identifier
  rating: number; // Rating value (e.g., 0-5)
  comment: string;
  created_at: string; // ISO 8601 date string
}

/**
 * Defines the main structure for the API's Product response.
 */
export interface Product {
  id: number;
  parent_product_id: number;
  parent_product_name: string;
  parent_category_name: string;
  model: string;
  sku: string;
  // Note: These should ideally be number, but using 'string' if API returns them as strings
  actual_price: string;
  discounted_price: string;
  color: string;
  smart_features: boolean;
  screen_size_name: string;
  resolution_name: string;
  panel_type_name: string;
  brand_name: string;

  // Nested Objects/Arrays
  electrical_specs: ElectricalSpecs;
  images: ProductImage[];
  videos: ProductVideo[];
  connectivity_details: ConnectivityDetail[];

  // Other details
  supported_internet_services_names: string; // Appears to be a comma-separated string
  quantity_in_stock: string; // Should likely be a number, but following the API response structure
  user_reviews: UserReview[];
}

export interface CartItem {
  id: number;
  product: Product; // Full product object details
  quantity: number;
  selectedColor: string; // e.g., 'Midnight Black'
  selectedSize: string; // Assuming size is a variant (e.g., 'M', 'L')
}
