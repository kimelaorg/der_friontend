export interface Slide {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  imgClass: string; // Used for custom background styling
}


export interface ProImage {
  id: number;
  productName: string;
  productDescription: string;
  productDiscountedPrice: number;
  productActualPrice: number;
  images: string[];
}


export interface BaseItem {
    id: number;
    product: number; // ProductSpecification ID
}

export interface ProductImage extends BaseItem {
    image: string | File; // string for reading (URL), File for creation/update
}

export interface ProductVideo extends BaseItem {
    video: string | File; // string for reading (URL), File for creation/update
}

// Define the full interface for data returned from the backend (Read/List)
export interface ConnectivityItem {
    id?: number;
    product: number;
    connectivity: number;
    connectivity_name: string; // Required by the model for display
    connectivity_count: number;
}

// Define a type for the data submitted via the form (Create/Update)
export interface ConnectivityPayload {
    id?: number; // Optional ID for updates
    product: number;
    connectivity: number;
    connectivity_count: number;
}

export interface ConnectivityItem {
    id?: number; // Make ID optional when creating a new item
    product: number;
    connectivity: number;
    connectivity_name: string;
    connectivity_count: number;
}

export interface ElectricalSpecs {
    id?: number; // Optional for creation, present for update
    product: number;
    voltage: string;
    max_wattage: string;
    frequency: string;
}

export interface BaseSetupItem { id?: number; name: string; }
export interface Brand extends BaseSetupItem { description: string; status: boolean; is_digital: boolean; }
export interface ProductCategory extends BaseSetupItem { description: string; status: boolean; is_digital: boolean; }
export interface ScreenSize extends BaseSetupItem {}
export interface SupportedResolution extends BaseSetupItem {}
export interface PanelType extends BaseSetupItem {}
export interface Connectivity extends BaseSetupItem {}
export interface SupportedInternetService extends BaseSetupItem {}

/** Corresponds to ElectricalSpecificationSerializer (Nested One-to-One in Spec) */
export interface ElectricalSpecification {
    id?: number;
    voltage: string;
    wattage: number;
    power_supply_type: string; // Assuming a text field for type
    product?: number; // read_only_fields = ('product',)
}

/** Corresponds to DigitalProductSerializer (Nested One-to-One in Product) */
export interface DigitalProduct {
    id?: number;
    license_type: number;
    fulfillment_method: number;
    // Assuming other required fields like is_downloadable, file_size, etc. are here
    // Per serializer, it includes 'videos' on read, but on write you only send FKs.
    product?: number; // read_only_fields = ('product',)
}

/** Corresponds to ProductSpecificationSerializer */
export interface ProductSpecification {
    id?: number;
    model: string;
    product: number; // Foreign Key to Product ID
    screen_size: number;
    brand: number;
    resolution: number;
    panel_type: number;
    actual_price: number;
    discounted_price: number;
    color: string | null;
    smart_features: boolean;
    supported_internet_services: number[]; // PrimaryKeyRelatedField (M2M IDs)

    // --- NEW FIELD FOR CONNECTIVITY ARRAY (Required for the API payload structure) ---
    // This holds the list of connectivity ports and their corresponding counts.
    product_connectivity?: {
        connectivity: number;      // ID of the Connectivity Type (e.g., HDMI ID)
        connectivity_count: number; // Count of that type (e.g., 3)
    }[];

    // OneToOne Relationship (Nested in Serializer)
    electrical_specs?: ElectricalSpecification | null; // Nullable for creation

    // Read-only nested details used for display (though not sent back to API)
    screen_size_detail?: ScreenSize;
    resolution_detail?: SupportedResolution;
    panel_type_detail?: PanelType;
}

/** Corresponds to ProductSerializer */
export interface Product {
    id?: number;
    name: string;
    description: string;
    brand: number;
    category: number;
    is_active: boolean;
    created_at?: string; // read_only_fields
    updated_at?: string; // read_only_fields

    // Management API fetches specs/digital_details on retrieve, not list
    product_specs?: ProductSpecification[];
    digital_details?: DigitalProduct;

    brand_detail?: Brand;
    category_detail?: ProductCategory;
}
