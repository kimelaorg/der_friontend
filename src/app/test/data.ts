export interface ApiMedia {
    id: number;
    image?: string;
    video?: string;
    product: number;
}

export interface ApiProduct {
    id: number;
    productName: string;
    model_number: string;
    productDiscountedPrice: string;
    productActualPrice: string;
    images: ApiMedia[];
    videos: ApiMedia[];
}

export interface MediaData {
    id: number;
    url: string;
}

export interface Product {
    id: number;
    productName: string;
    model_number: string;
    productDiscountedPrice: string;
    productActualPrice: string;
    images: MediaData[];
    videos: MediaData[];
}

export interface FieldErrors {
    [key: string]: string[];
}
