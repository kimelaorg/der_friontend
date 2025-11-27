import { Component, OnInit, TemplateRef, inject, signal, WritableSignal, ViewChild } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { faEdit, faTrash, faImage, faVideo, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { catchError } from 'rxjs/operators';
import { throwError, forkJoin } from 'rxjs';
import { ApiMedia, ApiProduct, MediaData, Product, FieldErrors }from './data';


@Component({
    selector: 'app-product-media', // Component renamed
    standalone: false,
    templateUrl: './product-media.html', // Template renamed
    styleUrl: './product-media.scss',   // Stylesheet renamed
})
export class ProductMedia implements OnInit { // Class renamed

    closeResult = '';

    // Consolidated API Endpoints
    private imageApiUrl = 'http://127.0.0.1:8000/api/products/images/';
    private videoApiUrl = 'http://127.0.0.1:8000/api/products/videos/';
    private productApiUrl = 'http://127.0.0.1:8000/api/products/media-list/';
    private imageDeleteUrl = 'http://127.0.0.1:8000/api/products/images-delete/';
    private videoDeleteUrl = 'http://127.0.0.1:8000/api/products/videos-delete/';

    @ViewChild('confirmDeletion') confirmDeletionTemplate!: TemplateRef<any>;
    @ViewChild('imageContent') imageContentTemplate!: TemplateRef<any>; // Need reference for modals
    @ViewChild('videoContent') videoContentTemplate!: TemplateRef<any>; // Need reference for modals

    products: WritableSignal<Product[]> = signal([]);
    selectedProduct: Product | null = null;
    filesToUpload: File[] = [];

    // Dedicated preview URLs
    selectedImageUrl: string | null = null;
    selectedVideoUrl: string | null = null;

    faEdit = faEdit;
    faVideo = faVideo;
    faImage = faImage;
    faTrash = faTrash;

    // Error State Management
    generalModalError: string | null = null;
    fieldValidationErrors: FieldErrors = {};

    private http = inject(HttpClient);

    constructor(private modalService: NgbModal) { }

    ngOnInit() {
        this.loadAll();
    }

    /**
     * Fetches products and maps the nested media arrays.
     */
    loadAll(): void {
        this.http.get<ApiProduct[]>(this.productApiUrl).subscribe({
            next: (apiResponse) => {
                const mappedProducts: Product[] = apiResponse.map(apiProduct => {

                    const imageObjects: MediaData[] = apiProduct.images.map(apiMedia => ({
                        id: apiMedia.id,
                        url: apiMedia.image! // Asserting image is present for image list
                    }));

                    const videoObjects: MediaData[] = apiProduct.videos.map(apiMedia => ({
                        id: apiMedia.id,
                        url: apiMedia.video! // Asserting video is present for video list
                    }));

                    return {
                        id: apiProduct.id,
                        productName: apiProduct.productName,
                        model_number: apiProduct.model_number,
                        productDiscountedPrice: apiProduct.productDiscountedPrice,
                        productActualPrice: apiProduct.productActualPrice,
                        images: imageObjects,
                        videos: videoObjects
                    };
                });
                this.products.set(mappedProducts);
            },
            error: (err) => {
                console.error('Error fetching products with media:', err);
            }
        });
    }

    // --------------------------------------------------------------------------------------------------
    // --- MODAL & VIEWER METHODS ---
    // --------------------------------------------------------------------------------------------------

    openMediaModal(product: Product, content: TemplateRef<any>): void {
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

    // Dedicated Image Viewer
    openImageViewer(imageUrl: string, content: TemplateRef<any>): void {
        this.selectedImageUrl = imageUrl;
        this.modalService.open(content, {
            ariaLabelledBy: 'modal-image-viewer',
            size: 'xl'
        }).result.then(
            () => { this.selectedImageUrl = null; },
            () => { this.selectedImageUrl = null; }
        );
    }

    // Dedicated Video Viewer
    openVideoPlayer(videoUrl: string, content: TemplateRef<any>): void {
        this.selectedVideoUrl = videoUrl;
        this.modalService.open(content, {
            ariaLabelledBy: 'modal-video-player',
            size: 'xl'
        }).result.then(
            () => { this.selectedVideoUrl = null; },
            () => { this.selectedVideoUrl = null; }
        );
    }

    // --------------------------------------------------------------------------------------------------
    // --- DELETE LOGIC (Combined) ---
    // --------------------------------------------------------------------------------------------------

    deleteProductMedia(mediaUrl: string, mediaType: 'image' | 'video'): void {
        if (!this.selectedProduct || !this.confirmDeletionTemplate) return;

        const mediaId = this.getMediaIdFromUrl(mediaUrl, mediaType);

        if (mediaId === null) {
            this.generalModalError = `Error: Could not find the ${mediaType} ID for deletion. Please reload.`;
            return;
        }

        this.modalService.open(this.confirmDeletionTemplate, { ariaLabelledBy: 'modal-confirm-deletion' }).result.then(
            (result) => {
                if (result === 'Delete click') {
                    this.executeMediaDeletion(mediaId, mediaUrl, mediaType);
                }
            },
            (reason) => {
                console.log(`Deletion cancelled by user: ${this.getDismissReason(reason)}`);
            }
        );
    }

    private executeMediaDeletion(mediaId: number, mediaUrl: string, mediaType: 'image' | 'video'): void {
        const deleteUrl = mediaType === 'image' ? this.imageDeleteUrl : this.videoDeleteUrl;

        this.http.delete(`${deleteUrl}${mediaId}`).pipe(
            catchError(error => {
                this.handleModalError(error, `Failed to delete ${mediaType}.`);
                return throwError(() => error);
            })
        ).subscribe(() => {
            const mediaArray = mediaType === 'image' ? this.selectedProduct!.images : this.selectedProduct!.videos;
            const index = mediaArray.findIndex(media => media.url === mediaUrl);

            if (index > -1) {
                mediaArray.splice(index, 1);
            }
            console.log(`Successfully deleted ${mediaType} ID: ${mediaId}.`);
            this.loadAll();
        });
    }

    private getMediaIdFromUrl(mediaUrl: string, mediaType: 'image' | 'video'): number | null {
        if (!this.selectedProduct) return null;

        const mediaArray = mediaType === 'image' ? this.selectedProduct.images : this.selectedProduct.videos;
        const media = mediaArray.find(m => m.url === mediaUrl);

        return media ? media.id : null;
    }

    // --------------------------------------------------------------------------------------------------
    // --- UPLOAD LOGIC (Combined) ---
    // --------------------------------------------------------------------------------------------------

    uploadStagedFiles(mediaType: 'image' | 'video'): void {
        if (!this.selectedProduct || this.filesToUpload.length === 0) return;

        this.generalModalError = null;
        this.fieldValidationErrors = {};

        const productID = this.selectedProduct.id.toString();
        const apiUrl = mediaType === 'image' ? this.imageApiUrl : this.videoApiUrl;
        const formField = mediaType === 'image' ? 'image' : 'video';

        const uploadObservables = this.filesToUpload.map(file => {
            const formData = new FormData();

            formData.append(formField, file, file.name);
            formData.append('product', productID);

            return this.http.post<ApiMedia>(apiUrl, formData).pipe(
                catchError(error => {
                    this.handleModalError(error, `Upload failed for file: ${file.name}.`);
                    return throwError(() => error);
                })
            );
        });

        forkJoin(uploadObservables).subscribe({
            next: (newMediaObjects: ApiMedia[]) => {
                const mediaArray = mediaType === 'image' ? this.selectedProduct!.images : this.selectedProduct!.videos;

                newMediaObjects.forEach(media => {
                    mediaArray.push({
                        id: media.id,
                        url: mediaType === 'image' ? media.image! : media.video!
                    });
                });
                this.filesToUpload = [];
                this.loadAll();
                console.log(`${newMediaObjects.length} ${mediaType} file(s) uploaded successfully.`);
            },
            error: (err) => {
                console.error(`One or more ${mediaType} uploads failed.`, err);
            }
        });
    }

    // --------------------------------------------------------------------------------------------------
    // --- ERROR HANDLING & HELPERS (Unchanged) ---
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

    // --- Drag and Drop Handlers (Unified) ---
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
