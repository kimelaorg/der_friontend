import { Component, OnInit, TemplateRef, inject, signal, WritableSignal, ViewChild } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { faEdit, faTrash, faImage, faVideo, IconDefinition, faTimesCircle, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { catchError, finalize } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { throwError, forkJoin, Observable } from 'rxjs';
import { ApiMedia, ApiProduct, MediaData, Product, FieldErrors }from './data';

// --------------------------------------------------------------------------------------------------
// --- NEW INTERFACE DEFINITION ---
// --------------------------------------------------------------------------------------------------

/** Defines the structure for a file that is staged for upload, including its status. */
interface StagedFile {
    id: string; // Unique ID for tracking purposes (used for internal management)
    file: File;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    uploadProgress: number; // For future use
}


@Component({
    selector: 'app-test',
    standalone: false,
    templateUrl: './test.html',
    styleUrl: './test.scss',
})
export class Test implements OnInit {

    closeResult = '';

    // Consolidated API Endpoints
    private imageApiUrl = 'http://127.0.0.1:8000/api/products/images/';
    private videoApiUrl = 'http://127.0.0.1:8000/api/products/videos/';
    private productApiUrl = 'http://127.0.0.1:8000/api/products/media-list/';
    private imageDeleteUrl = 'http://127.00.0.1:8000/api/products/images-delete/';
    private videoDeleteUrl = 'http://127.0.0.1:8000/api/products/videos-delete/';

    @ViewChild('confirmDeletion') confirmDeletionTemplate!: TemplateRef<any>;
    @ViewChild('imageContent') imageContentTemplate!: TemplateRef<any>;
    @ViewChild('videoContent') videoContentTemplate!: TemplateRef<any>;

    products: WritableSignal<Product[]> = signal([]);
    selectedProduct: Product | null = null;

    // 🔥 MODIFIED: Use the new StagedFile interface
    filesToUpload: StagedFile[] = [];
    isUploading: boolean = false; // 🔥 NEW: Global flag for the button

    // Dedicated preview URLs
    selectedImageUrl: string | null = null;
    selectedVideoUrl: string | null = null;

    faEdit = faEdit;
    faVideo = faVideo;
    faImage = faImage;
    faTrash = faTrash;
    // 🔥 NEW: Icons for status display
    faTimesCircle = faTimesCircle;
    faCheckCircle = faCheckCircle;
    faSpinner = faSpinner;

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
                        url: apiMedia.image!
                    }));

                    const videoObjects: MediaData[] = apiProduct.videos.map(apiMedia => ({
                        id: apiMedia.id,
                        url: apiMedia.video!
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

    get pendingOrErrorFilesCount(): number {
      return this.filesToUpload.filter(f => f.status === 'pending' || f.status === 'error').length;
  }

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

    // ... (openMediaModal, openImageViewer, openVideoPlayer, deleteProductMedia, executeMediaDeletion, getMediaIdFromUrl are unchanged)

    // --------------------------------------------------------------------------------------------------
    // --- UPLOAD LOGIC (Combined - MODIFIED FOR STATUS) ---
    // --------------------------------------------------------------------------------------------------

    uploadStagedFiles(mediaType: 'image' | 'video'): void {
        if (!this.selectedProduct || this.filesToUpload.filter(f => f.status === 'pending' || f.status === 'error').length === 0) {
            this.generalModalError = "No pending files found to upload.";
            return;
        }

        this.generalModalError = null;
        this.fieldValidationErrors = {};
        this.isUploading = true; // Set global button loading state

        const productID = this.selectedProduct!.id.toString();
        const apiUrl = mediaType === 'image' ? this.imageApiUrl : this.videoApiUrl;
        const formField = mediaType === 'image' ? 'image' : 'video';

        // Get only the files that need to be uploaded
        const pendingFiles = this.filesToUpload.filter(f => f.status === 'pending' || f.status === 'error');

        const uploadObservables: Observable<ApiMedia>[] = pendingFiles.map(stagedItem => {

            // Mark file as uploading immediately
            stagedItem.status = 'uploading';
            this.filesToUpload = [...this.filesToUpload]; // Trigger view update

            const formData = new FormData();
            formData.append(formField, stagedItem.file, stagedItem.file.name);
            formData.append('product', productID);

            return this.http.post<ApiMedia>(apiUrl, formData).pipe(
                catchError(error => {
                    // Mark the specific file as error on failure
                    stagedItem.status = 'error';
                    this.filesToUpload = [...this.filesToUpload]; // Trigger view update
                    this.handleModalError(error, `Upload failed for file: ${stagedItem.file.name}.`);
                    return throwError(() => error); // Propagate error for forkJoin to fail
                })
            );
        });

        forkJoin(uploadObservables).pipe(
            finalize(() => {
                this.isUploading = false; // Reset global loading flag
                this.filesToUpload = [...this.filesToUpload]; // Ensure final view refresh
            })
        ).subscribe({
            next: (newMediaObjects: ApiMedia[]) => {
                // Find all successfully uploaded files by ID (or file name if API doesn't return ID)
                // For simplicity, we'll mark the original pending/uploading files as complete based on the response count.
                // A safer approach requires the API to return the file's original name/ID.

                let successCount = 0;
                this.filesToUpload.forEach(stagedItem => {
                    // A simple check to mark successful uploads
                    // This relies on the order being the same, which forkJoin guarantees.
                    if (stagedItem.status === 'uploading' && successCount < newMediaObjects.length) {
                         stagedItem.status = 'complete';
                         successCount++;

                         // Add the new media object to the product's media array
                         const media = newMediaObjects[successCount - 1];
                         const mediaArray = mediaType === 'image' ? this.selectedProduct!.images : this.selectedProduct!.videos;
                         mediaArray.push({
                            id: media.id,
                            url: mediaType === 'image' ? media.image! : media.video!
                         });
                    }
                });

                // 🔥 Clean up the staged list by removing completed files
                this.filesToUpload = this.filesToUpload.filter(f => f.status !== 'complete');
                this.loadAll();
                console.log(`${newMediaObjects.length} ${mediaType} file(s) uploaded successfully.`);
            },
            error: (err) => {
                console.error(`One or more ${mediaType} uploads failed.`, err);
                // Note: Per-file error messages are already handled in catchError
            }
        });
    }

    // --------------------------------------------------------------------------------------------------
    // --- DRAG AND DROP / FILE SELECTION HANDLERS (MODIFIED) ---
    // --------------------------------------------------------------------------------------------------

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
        // Clear the input value so the user can select the same file again if needed
        input.value = '';
    }

    handleFileSelection(fileList: FileList): void {
        for (let i = 0; i < fileList.length; i++) {
            const newFile: StagedFile = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Simple unique ID
                file: fileList[i],
                status: 'pending',
                uploadProgress: 0
            };
            this.filesToUpload.push(newFile);
        }
        // Force update to the view
        this.filesToUpload = [...this.filesToUpload];
        console.log('Files staged for upload:', this.filesToUpload);
    }

    /**
     * 🔥 NEW: Removes a staged file from the list based on the original File object.
     * @param fileToRemove The original File object inside the StagedFile wrapper.
     */
    removeStagedFile(fileToRemove: File): void {
        this.filesToUpload = this.filesToUpload.filter(item => item.file !== fileToRemove);
    }

    // --------------------------------------------------------------------------------------------------
    // --- ERROR HANDLING & HELPERS (Unchanged) ---
    // --------------------------------------------------------------------------------------------------

    // ... (handleModalError and getDismissReason are unchanged)
}
