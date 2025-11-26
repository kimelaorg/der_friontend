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

export interface Product {
  name: string;
  price: number;
  rating: number;
  link: string;
  imgUrl: string; // Placeholder image URL
}


export interface IConnectivityDetail {
  id: number;
  connectivity: number;
  connectivity_name: string;
  connectivity_count: number;
}

export interface IImage {
  id: number;
  image: string; // URL string
  product: number;
}

export interface IVideo {
  id: number;
  video: string; // URL string
  product: number;
}

export interface IElectricalSpecs {
  id: number;
  voltage: string;
  max_wattage: string;
  frequency: string;
  product: number;
}

export interface IProductSpec {
  id: number;
  electrical_specs: IElectricalSpecs;
  images: IImage[];
  videos: IVideo[];
  connectivity_details: IConnectivityDetail[];
  screen_size_name: string;
  resolution_name: string;
  panel_type_name: string;
  model: string;
  supported_internet_services_names: string[];
  sku: string;
  original_price: string;
  sale_price: string;
  color: string;
  smart_features: boolean;
  screen_size: number;
  brand_name: string;
  resolution: number;
  panel_type: number;
  supported_internet_services: number[];
  quantity_in_stock: number;
}

export interface IProduct {
  id: number;
  name: string;
  description: string;
  category: number;
  category_name: string;
  is_active: boolean;
  product_specs: IProductSpec[];
  digital_details: any | null;
  created_at: string;
  updated_at: string;
}

export interface IPaginatedProductList {
  count: number;
  next: string | null;
  previous: string | null;
  results: IProduct[];
}
