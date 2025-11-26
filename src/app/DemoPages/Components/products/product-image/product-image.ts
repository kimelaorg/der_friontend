import { Component, OnInit, TemplateRef, inject, signal, WritableSignal, ViewChild } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// ⚠️ IMPORTANT: Added 'forkJoin' here to manage multiple simultaneous requests
import { catchError } from 'rxjs/operators';
import { throwError, forkJoin } from 'rxjs';

// --- INTERFACE DEFINITIONS ---
interface ApiImage {
    id: number;
    image: string; // The URL as received from the API
    product: number;
}
interface ApiProduct {
    id: number;
    productName: string;
    productDescription: string;
    productDiscountedPrice: string;
    productActualPrice: string;
    images: ApiImage[];
}

interface ImageData {
    id: number;
    url: string;
}

export interface Product {
    id: number;
    productName: string;
    productDescription: string;
    productDiscountedPrice: string;
    productActualPrice: string;
    images: ImageData[];
}

interface FieldErrors {
    [key: string]: string[];
}
// --- END INTERFACE DEFINITIONS ---


@Component({
    selector: 'app-product-image',
    standalone: false,
    templateUrl: './product-image.html',
    styleUrl: './product-image.scss',
})
export class ProductImage implements OnInit {

    closeResult = '';

    private newApiUrl = 'http://127.0.0.1:8000/api/products/images/';
    private productApiUrl = 'http://127.0.0.1:8000/api/products/images-list/';
    private imageDeleteUrl = 'http://127.0.0.1:8000/api/products/images-delete/';

    @ViewChild('confirmDeletion') confirmDeletionTemplate!: TemplateRef<any>;

    products: WritableSignal<Product[]> = signal([]);
    selectedProduct: Product | null = null;
    filesToUpload: File[] = [];

    // Error State Management
    generalModalError: string | null = null;
    fieldValidationErrors: FieldErrors = {};

    private http = inject(HttpClient);

    constructor(private modalService: NgbModal) { }

    ngOnInit() {
        this.loadAll();
    }

    /**
     * Fetches products and maps the nested ApiImage array to the flat ImageData array.
     */
    loadAll(): void {
        this.http.get<ApiProduct[]>(this.productApiUrl).subscribe({
            next: (apiResponse) => {
                const mappedProducts: Product[] = apiResponse.map(apiProduct => {
                    const imageObjects: ImageData[] = apiProduct.images.map(apiImage => ({
                        id: apiImage.id,
                        url: apiImage.image
                    }));

                    return {
                        id: apiProduct.id,
                        productName: apiProduct.productName,
                        productDescription: apiProduct.productDescription,
                        productDiscountedPrice: apiProduct.productDiscountedPrice,
                        productActualPrice: apiProduct.productActualPrice,
                        images: imageObjects
                    };
                });
                this.products.set(mappedProducts);
            },
            error: (err) => {
                console.error('Error fetching products:', err);
            }
        });
    }

    // --- Image Modal Methods (Open, Close Reason) ---

    openImageModal(product: Product, content: TemplateRef<any>): void {
        this.selectedProduct = product;
        this.filesToUpload = [];
        this.generalModalError = null;
        this.fieldValidationErrors = {};

        this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'lg' }).result.then(
            (result) => {
                this.closeResult = `Closed with: ${result}`;
            },
            (reason) => {
                this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
            },
        );
    }

    // --- DELETE LOGIC ---

    deleteProductImage(imageUrl: string): void {
        if (!this.selectedProduct || !this.confirmDeletionTemplate) return;

        const imageId = this.getImageIdFromUrl(imageUrl);

        if (imageId === null) {
            this.generalModalError = "Error: Could not find the image ID for deletion. Please reload the page.";
            return;
        }

        this.modalService.open(this.confirmDeletionTemplate, { ariaLabelledBy: 'modal-confirm-deletion' }).result.then(
            (result) => {
                if (result === 'Delete click') {
                    this.executeImageDeletion(imageId, imageUrl);
                }
            },
            (reason) => {
                console.log(`Deletion cancelled by user: ${this.getDismissReason(reason)}`);
            }
        );
    }

    private executeImageDeletion(imageId: number, imageUrl: string): void {
        this.http.delete(`${this.imageDeleteUrl}${imageId}`).pipe(
            catchError(error => {
                this.handleModalError(error, 'Failed to delete image.');
                return throwError(() => error);
            })
        ).subscribe(() => {
            const index = this.selectedProduct!.images.findIndex(img => img.url === imageUrl);

            if (index > -1) {
                this.selectedProduct!.images.splice(index, 1);
            }
            console.log(`Successfully deleted image ID: ${imageId}.`);
            this.loadAll(); // Reload all data
        });
    }

    private getImageIdFromUrl(imageUrl: string): number | null {
        if (!this.selectedProduct) return null;

        const image = this.selectedProduct.images.find(img => img.url === imageUrl);

        return image ? image.id : null;
    }

// --------------------------------------------------------------------------------------------------
// --- UPLOAD LOGIC (FIXED) ---
// --------------------------------------------------------------------------------------------------

    /**
     * Sends each staged file in a separate request to the DRF CreateAPIView.
     * This is required because the DRF serializer expects a single 'image' field per request.
     */
    uploadStagedFiles(): void {
        if (!this.selectedProduct || this.filesToUpload.length === 0) return;

        this.generalModalError = null;
        this.fieldValidationErrors = {};

        const productID = this.selectedProduct.id.toString();

        // 1. Map each file to its own POST request Observable
        const uploadObservables = this.filesToUpload.map(file => {
            const formData = new FormData();

            // 🔥 CRITICAL FIX: The file field key MUST be named 'image' to match the serializer.
            formData.append('image', file, file.name);
            formData.append('product', productID);

            // Send the request for this single file
            return this.http.post<ApiImage>(this.newApiUrl, formData).pipe(
                catchError(error => {
                    this.handleModalError(error, `Upload failed for file: ${file.name}.`);
                    // IMPORTANT: Return a valid empty object here if you want forkJoin to continue
                    // processing other successful files after a single file error.
                    // If you throw here, forkJoin fails immediately.
                    return throwError(() => error);
                })
            );
        });

        // 2. Use forkJoin to manage all simultaneous uploads and wait for completion
        forkJoin(uploadObservables).subscribe({
            next: (newImageObjects: ApiImage[]) => {
                // Filter out any potential failed responses if error handling was adjusted to continue
                // Since we throw the error above, we can assume we only get successful objects here.
                newImageObjects.forEach(img => {
                    this.selectedProduct!.images.push({
                        id: img.id,
                        url: img.image
                    });
                });
                this.filesToUpload = []; // Clear staged files
                this.loadAll();
                console.log(`${newImageObjects.length} files uploaded successfully.`);
            },
            error: (err) => {
                // This block runs if any single request fails (due to the throwError above)
                // The handleModalError method should have already been called for the failed request.
                console.error("One or more image uploads failed.", err);
            }
        });
    }

    // --------------------------------------------------------------------------------------------------
    // --- ERROR HANDLING & HELPERS ---
    // --------------------------------------------------------------------------------------------------

    private handleModalError(error: HttpErrorResponse, defaultMessage: string): void {
        if (error.status === 400 && error.error) {
            const validationErrors: FieldErrors = {};
            if (error.error.non_field_errors) {
                this.generalModalError = error.error.non_field_errors.join(' ');
            } else if (error.error.detail) {
                this.generalModalError = error.error.detail;
            } else {
                for (const key in error.error) {
                    if (Array.isArray(error.error[key])) {
                        validationErrors[key] = error.error[key];
                    }
                }
                if (Object.keys(validationErrors).length > 0) {
                    this.fieldValidationErrors = validationErrors;
                    this.generalModalError = "Please check the highlighted fields for errors.";
                } else {
                    this.generalModalError = defaultMessage;
                }
            }
        } else {
            this.generalModalError = `${defaultMessage} Server responded with status: ${error.status}`;
        }
        console.error('Backend Error:', error);
    }

    private getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) {
            return 'by pressing ESC';
        } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
            return 'by clicking on a backdrop';
        } else {
            return `with: ${reason}`;
        }
    }

    // --- Drag and Drop Handlers (Unchanged) ---
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        const files = event.dataTransfer?.files;
        if (files) {
            this.handleFileSelection(files);
        }
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.handleFileSelection(input.files);
        }
    }

    handleFileSelection(fileList: FileList): void {
        for (let i = 0; i < fileList.length; i++) {
            this.filesToUpload.push(fileList[i]);
        }
        console.log('Files staged for upload:', this.filesToUpload);
    }
}
