export interface NavLink {
  label: string;
  link: string;
}

export interface Slide {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  imgClass: string; // Used for custom background styling
}

// 1. IImage: Images linked to the specification
export interface IImage {
    id: number;
    image: string; // The URL string for the image
    product: number; // The related ProductSpecification ID
}

// 2. IVideo: Videos linked to the specification
export interface IVideo {
    id: number;
    video: string; // The URL string for the video
    product: number; // The related ProductSpecification ID
}

// 3. IConnectivityDetail: Details about connectivity ports/features
export interface IConnectivityDetail {
    id: number;
    connectivity: number;
    connectivity_name: string;
    connectivity_count: number;
}

// 4. IElectricalSpecs: Power consumption details (Can be null)
export interface IElectricalSpecs {
    id: number;
    voltage: string;
    max_wattage: string;
    frequency: string;
    product: number; // The related ProductSpecification ID
}

export interface IProductSpecification {
    // --- Core ID ---
    id: number; // The ID of the specific Product Specification (Model/SKU)

    // --- Parent Product Linkage (Context from the old IProduct) ---
    parent_product_id: number;
    parent_product_name: string;
    parent_category_name: string;

    // --- Direct Specification Fields ---
    model: string;
    sku: string;
    color: string | null;
    smart_features: boolean;

    // --- Price Fields (using backend names) ---
    actual_price: string; // Maps to actual_price in the API
    discounted_price: string; // Maps to discounted_price in the API

    // --- FK Names (Human-readable lookups) ---
    brand_name: string;
    screen_size_name?: string; // Optional if not all products use this field
    resolution_name?: string;
    panel_type_name?: string;

    // --- Nested Details ---
    electrical_specs: IElectricalSpecs | null;
    images: IImage[];
    videos: IVideo[];
    connectivity_details: IConnectivityDetail[];
    supported_internet_services_names: string[]; // Corrected type: array of strings

    // --- Method Fields ---
    // NOTE: This field is a string in your JSON, but should ideally be number for stock count.
    quantity_in_stock: string;
}

export interface IPaginatedSpecificationList {
    count: number; // Will be 7
    next: string | null;
    previous: string | null;
    // CRITICAL: The results array is now flat, containing IProductSpecification objects
    results: IProductSpecification[];
}
