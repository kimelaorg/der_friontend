import { Component, OnInit, TemplateRef, inject, signal, WritableSignal, ViewChild } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse, HttpParams } from '@angular/common/http';
import { faTrash, faTimesCircle, faMagnifyingGlass, faStar, faCheck, faPlus, IconDefinition, faCheckCircle, faSpinner, faHdd, faDownload, faBan } from '@fortawesome/free-solid-svg-icons';
import { catchError, finalize } from 'rxjs/operators';
import { throwError, forkJoin, Observable } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ActionButton } from '../../../Layout/Components/page-title/page-title.component';


interface FieldErrors { [key: string]: string[]; }

interface StagedFile {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    uploadProgress: number;
    name: string;
    category: string;
    size_mb: number;
    errorMessage?: string;
}

interface SoftwareRecord {
    id: number;
    name: string;
    mime_type: string;
    size_mb: number;
    category: string;
    file: string;
    date_uploaded: string;
    uploaded_by: string;
    is_for_sale: boolean;
}


@Component({
  selector: 'app-software-products',
  standalone: false,
  templateUrl: './software-products.html',
  styleUrl: './software-products.scss',
})
export class SoftwareProducts implements OnInit {

  heading = 'Software Library Management';
  subheading = 'Manage software related Products.';
  icon = 'pe-7s-diskette icon-gradient bg-happy-green';

  private softwareApiUrl = 'http://127.0.0.1:8000/api/products/softwares/';

  @ViewChild('softwareContent') softwareContentTemplate!: TemplateRef<any>;
  @ViewChild('confirmDeletion') confirmDeletionTemplate!: TemplateRef<any>;

  softwareLibrary: WritableSignal<SoftwareRecord[]> = signal([]);
  filesToUpload: StagedFile[] = [];
  isUploading: boolean = false;
  isLoading: WritableSignal<boolean> = signal(false);

  faTrash = faTrash;
  faTimesCircle = faTimesCircle;
  faCheckCircle = faCheckCircle;
  faSpinner = faSpinner;
  faHdd = faHdd;
  faDownload = faDownload;
  faCheck = faCheck;
  faBan = faBan;
  faSearch = faMagnifyingGlass;

  generalModalError: string | null = null;
  message: string | null = null;
  messageok: string | null = null;
  fieldValidationErrors: FieldErrors = {};
  currentSearchTerm: string = '';
  currentCategoryFilter: string = '';
  availableCategories: string[] = ['Uncategorized', 'Operating Systems', 'Design', 'Development', 'Utilities'];

  private http = inject(HttpClient);
  private modalService = inject(NgbModal);

  // --- LIFECYCLE & INITIAL LOAD ---

  ngOnInit() {
      this.loadSoftwareLibrary();
  }

  loadSoftwareLibrary(): void {
      let params = new HttpParams();

      if (this.currentSearchTerm) {
          // DRF SearchFilter uses the 'search' query parameter
          params = params.set('search', this.currentSearchTerm);
      }

      if (this.currentCategoryFilter) {
          // DRF DjangoFilterBackend uses the field name, 'category'
          params = params.set('category', this.currentCategoryFilter);
      }

      this.http.get<SoftwareRecord[]>(this.softwareApiUrl, { params: params }).subscribe({
          next: (apiResponse) => {
              this.softwareLibrary.set(apiResponse);
          },
          error: (err) => {
              console.error('Error fetching software library:', err);
              this.generalModalError = 'Failed to load software library.';
          }
      });
  }

  applySearch(): void {
      // This handler triggers data reload based on the two-way bound search term
      this.loadSoftwareLibrary();
  }

  onCategoryChange(event: Event): void {
      const selectElement = event.target as HTMLSelectElement;
      // Update the filter state and reload the data
      this.currentCategoryFilter = selectElement.value;
      this.loadSoftwareLibrary();
  }

  // Download Logics
  downloadSoftware(record: SoftwareRecord): void {
      // Construct the full URL. If 'record.file' is already a full URL, use it directly.
      // Assuming record.file is the path to the file on the backend server.
      const fileUrl = record.file.startsWith('http') ? record.file : `http://127.0.0.1:8000${record.file}`;

      // **1. Make a GET request for the file data**
      // We use { responseType: 'blob', observe: 'response' } to handle binary data
      // and to get access to headers (specifically Content-Disposition for the filename).
      this.http.get(fileUrl, { responseType: 'blob', observe: 'response' }).pipe(
          catchError((error: HttpErrorResponse) => {
              this.handleModalError(error, `Failed to download file: ${record.name}.`);
              return throwError(() => error);
          })
      ).subscribe((response: HttpResponse<Blob>) => {
          if (!response.body) {
              this.generalModalError = `Download failed: Empty response body for ${record.name}.`;
              return;
          }

          // **2. Determine the filename**
          // Prefer the filename from the Content-Disposition header if available.
          let filename = record.name;
          const contentDisposition = response.headers.get('Content-Disposition');
          if (contentDisposition) {
              const match = contentDisposition.match(/filename="?(.+?)"?($|;)/i);
              if (match && match[1]) {
                  filename = match[1];
              }
          }

          // **3. Create a download link and trigger the download**
          const blob = new Blob([response.body], { type: record.mime_type });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename; // Set the filename
          document.body.appendChild(a);
          a.click();

          // Cleanup
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          console.log(`Successfully triggered download for ${filename}`);
      });
  }

  // toggle for updating is_for_sale status

  toggleForSaleStatus(record: SoftwareRecord, newValue: boolean): void {
        const updateData = { is_for_sale: newValue };
        const apiUrl = `${this.softwareApiUrl}${record.id}/`;

        // Optimistically update the local signal, and roll back on error.
        const originalValue = (record as any).is_for_sale; // Cast to access is_for_sale
        // NOTE: You should update your SoftwareRecord interface to include is_for_sale
        (record as any).is_for_sale = newValue;

        this.http.patch<SoftwareRecord>(apiUrl, updateData).pipe(
            catchError((error: HttpErrorResponse) => {
                // Rollback the local change on error
                (record as any).is_for_sale = originalValue;
                this.handleModalError(error, `Failed to update 'For Sale' status for ${record.name}.`);
                return throwError(() => error);
            })
        ).subscribe({
            next: (updatedRecord) => {
                // Backend successfully saved the data.
                // We don't need to explicitly update the signal since we mutated the object reference,
                // but we should refresh the library if the backend returns more data than just the patch.
                console.log(`Successfully updated ${record.name} to Is For Sale: ${newValue}`);
            },
            error: () => {
                // Error handled in pipe(catchError)
            }
        });
    }

  // --- FILE STAGING HANDLERS ---

  get pendingOrErrorFilesCount(): number {
      return this.filesToUpload.filter(f => f.status === 'pending' || f.status === 'error').length;
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); }
  onDrop(event: DragEvent): void {
      event.preventDefault();
      event.stopPropagation();
      const files = event.dataTransfer?.files;
      if (files) { this.handleFileSelection(files); }
  }

  onFileSelect(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (input.files) { this.handleFileSelection(input.files); }
      input.value = '';
  }

  handleFileSelection(fileList: FileList): void {
      for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          const newFile: StagedFile = {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
              file: file,
              status: 'pending',
              uploadProgress: 0,
              name: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
              category: 'Uncategorized',
              size_mb: file.size / (1024 * 1024)
          };
          this.filesToUpload.push(newFile);
      }
      this.filesToUpload = [...this.filesToUpload];
  }

  removeStagedFile(fileToRemove: File): void {
      this.filesToUpload = this.filesToUpload.filter(item => item.file !== fileToRemove);
  }

  // --- UPLOAD LOGIC ---

  uploadStagedSoftwares(): void {
      const pendingFiles = this.filesToUpload.filter(f => f.status === 'pending' || f.status === 'error');
      if (pendingFiles.length === 0) {
          this.generalModalError = "No pending files found to upload.";
          return;
      }

      this.generalModalError = null;
      this.fieldValidationErrors = {};
      this.isUploading = true;

      const uploadObservables: Observable<SoftwareRecord>[] = pendingFiles.map(stagedItem => {

          if (!stagedItem.name || stagedItem.name.trim() === '') {
              stagedItem.status = 'error';
              stagedItem.errorMessage = 'Name is required.';
              return throwError(() => new Error('Name is required.'));
          }

          stagedItem.status = 'uploading';
          this.filesToUpload = [...this.filesToUpload];

          const formData = new FormData();

          // APPENDING ONLY THE 4 REQUIRED FIELDS
          formData.append('file', stagedItem.file, stagedItem.file.name);
          formData.append('name', stagedItem.name);
          formData.append('size_mb', stagedItem.size_mb.toFixed(6));
          formData.append('category', stagedItem.category);

          return this.http.post<SoftwareRecord>(this.softwareApiUrl, formData).pipe(
              catchError(error => {
                  stagedItem.status = 'error';
                  this.filesToUpload = [...this.filesToUpload];
                  this.handleModalError(error as HttpErrorResponse, `Upload failed for ${stagedItem.name}.`);
                  return throwError(() => error);
              })
          );
      });

      forkJoin(uploadObservables.filter(obs => !(obs instanceof Observable && (obs as any)['_subscribe'] === undefined))).pipe(
          finalize(() => {
              this.isUploading = false;
              this.filesToUpload = [...this.filesToUpload];
          })
      ).subscribe({
          next: (newSoftwareRecords: SoftwareRecord[]) => {
              let successCount = 0;
              this.filesToUpload.forEach(stagedItem => {
                  if (stagedItem.status === 'uploading') {
                      stagedItem.status = 'complete';
                      successCount++;
                      this.softwareLibrary.update(list => [...list, newSoftwareRecords[successCount - 1]]);
                  }
              });

              this.filesToUpload = this.filesToUpload.filter(f => f.status !== 'complete');
              this.messageok =`${successCount} software file(s) uploaded successfully.`
              this.loadSoftwareLibrary();
              console.log(`${successCount} software file(s) uploaded successfully.`);
          },

          error: (err) => {
              console.error('One or more software uploads failed.', err);
          },

      });
  }

  // --- MODAL & ACTION HANDLERS ---

  openSoftwareManagement(): void {
      this.openSoftwareModal(this.softwareContentTemplate);
  }

  private openSoftwareModal(content: TemplateRef<any>): void {
      this.filesToUpload = [];
      this.generalModalError = null;
      this.fieldValidationErrors = {};

      this.modalService.open(content, { ariaLabelledBy: 'modal-software-title', size: 'lg' }).result.then(
          (result) => { /* Handle close */ },
          (reason) => { /* Handle dismiss */ },
      );
  }

  deleteSoftware(id: number): void {
      this.modalService.open(this.confirmDeletionTemplate).result.then(
          (result) => {
              if (result === 'Delete click') {
                  // Implement actual deletion logic here
                  this.http.delete(`${this.softwareApiUrl}${id}/`).pipe(
                      catchError((error: HttpErrorResponse) => {
                          this.handleModalError(error, `Failed to delete software ID ${id}.`);
                          return throwError(() => error);
                      })
                  ).subscribe(() => {
                      this.softwareLibrary.update(list => list.filter(s => s.id !== id));
                      this.message = `Software ID ${id} deleted successfully.`;
                  });
              }
          },
          (reason) => { /* Dismissed */ }
      );
  }


  // --- ERROR HANDLING (Generic) ---

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

  handleCreateModal = () => {
     this.openSoftwareManagement();
  }

  actionButtons: ActionButton[] = [
    {
      text: 'New Upload',
      icon: faPlus,
      class: 'btn-success',
      onClick: this.handleCreateModal
    }
  ];

}
