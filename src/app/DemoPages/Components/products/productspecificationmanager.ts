import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {  BaseItem, ProImage, ProductImage, ProductVideo, ConnectivityItem, ElectricalSpecs, ConnectivityPayload} from "./manager";

@Injectable({
  providedIn: 'root',
})
export class Productspecificationmanager {

  private http = inject(HttpClient);
    private apiUrl = 'http://127.0.0.1:8000/api/products'; // Base API URL

    // --- Helper for file upload forms (Multipart/FormData) ---
    private createFormData(data: any, fileKey: string, file?: File | string): FormData {
        const formData = new FormData();
        // Append all non-file fields
        for (const key in data) {
            if (key !== fileKey && data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        }
        // Append the file if it's a File object
        if (file instanceof File) {
             formData.append(fileKey, file, file.name);
        }
        return formData;
    }

    // --- 1. Product Images CRUD ---

    getImages(productId: number): Observable<ProImage[]> {
        return this.http.get<ProImage[]>(`${this.apiUrl}/images/`);
    }

    createImage(productId: number, data: ProductImage, file: File): Observable<ProductImage> {
        const formData = this.createFormData(data, 'image', file);
        return this.http.post<ProductImage>(`${this.apiUrl}/images/`, formData);
    }

    deleteImage(imageId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/images/${imageId}/`);
    }

    // --- 2. Product Videos CRUD (Similar to Images) ---

    getVideos(productId: number): Observable<ProductVideo[]> {
        return this.http.get<ProductVideo[]>(`${this.apiUrl}/videos/`);
    }

    createVideo(productId: number, data: ProductVideo, file: File): Observable<ProductVideo> {
        const formData = this.createFormData(data, 'video', file);
        return this.http.post<ProductVideo>(`${this.apiUrl}/videos/`, formData);
    }

    deleteVideo(videoId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/videos/${videoId}/`);
    }

    // --- 3. Product Connectivity CRUD ---

    getConnectivity(productId: number): Observable<ConnectivityItem[]> {
        return this.http.get<ConnectivityItem[]>(`${this.apiUrl}/connectivity/`);
    }

    createConnectivity(productId: number, data: ConnectivityPayload): Observable<ConnectivityItem> {
        return this.http.post<ConnectivityItem>(`${this.apiUrl}/connectivity/`, data);
    }

    updateConnectivity(itemId: number, data: Partial<ConnectivityPayload>): Observable<ConnectivityItem> {
        return this.http.patch<ConnectivityItem>(`${this.apiUrl}/connectivity/${itemId}/`, data);
    }

    deleteConnectivity(itemId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/connectivity/${itemId}/`);
    }

    // --- 4. Electrical Specifications (OneToOne CRUD) ---

    getElectricalSpecs(productId: number): Observable<ElectricalSpecs> {
        return this.http.get<ElectricalSpecs>(`${this.apiUrl}/specs/`);
    }

    createOrUpdateElectricalSpecs(productId: number, data: ElectricalSpecs): Observable<ElectricalSpecs> {
        // If the specs exist (have an ID), use PUT/PATCH, otherwise POST/PUT to the detail endpoint
        if (data.id) {
            return this.http.patch<ElectricalSpecs>(`${this.apiUrl}/specs/`, data);
        } else {
            return this.http.put<ElectricalSpecs>(`${this.apiUrl}/specs/`, data);
        }
    }

}
