import { Component, signal, WritableSignal, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { FormBuilder, FormGroup, Validators, FormControl, NonNullableFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { faStar, faPlus, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { ActionButton } from '../../../Layout/Components/page-title/page-title.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';


export interface ProductCategory {
  id?: number;
  name: string;
  description: string;
  created_at: string;
  status: boolean;
  is_digital: boolean;
}

interface CategoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductCategory[];
}

interface CartegoryForm {
  name: FormControl<string>;
  description: FormControl<string>;
  is_digital: FormControl<string>;
  status: FormControl<string>; // ADDED: Status field to form group
}


@Component({
  selector: 'app-cartegories',
  standalone: false,
  templateUrl: './cartegories.html',
  styleUrl: './cartegories.scss',
})
export class Cartegories implements OnInit {

  http = inject(HttpClient);
  private router = inject(Router);
  private formBuilder = inject(NonNullableFormBuilder);
  constructor(private modalService: NgbModal) {}

  @ViewChild('createCategoryModal') modalContent: ElementRef | undefined;
  @ViewChild('deleteConfirmationModal') deleteModalContent: ElementRef | undefined;

  private baseUrl = 'http://localhost:8000/api/setups';
  heading = 'Product Cartegories';
  subheading = 'Manage cartegories related to your Business Products.';
  icon = 'pe-7s-keypad icon-gradient bg-happy-green';

  categories: ProductCategory[] = [];
  totalCount: number = 0;
  pageSize: number = 5;
  // currentPage is kept as 1-based internally for data processing clarity
  currentPage: number = 1;
  categoryUrl = `${this.baseUrl}/categories/`;

  currentCategoryId: number | null = null;
  modalMode: 'create' | 'edit' | 'delete' = 'create';

  message: WritableSignal<string | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(false);
  closeResult = '';
  // Signal to hold the data being edited
  currentCategoryData: WritableSignal<ProductCategory | null> = signal(null);

  newCartegoryForm: FormGroup<CartegoryForm> = this.formBuilder.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    is_digital: ['', [Validators.required]],
    status: ['true', [Validators.required]], // ADDED: Default status to 'true' for creation
  });

  ngOnInit(): void {
    this.loadAll(`${this.categoryUrl}`);
  }


  loadAll(url: string): void {
    this.http.get<CategoryResponse>(url).subscribe(res => {
      this.categories = res.results;
    });
  }

  handlePageEvent(event: PageEvent): void {
    const newUrl = `${this.categoryUrl}`;
    this.loadAll(newUrl);
  }

  open(content: any | null){
    this.modalService.open(content).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;

      if (result === 'saved' || result === 'deleted') {
        // Reload data from the first page after a successful operation
        this.loadAll(`${this.categoryUrl}`);
      }
      console.log(this.closeResult);
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      console.log(this.closeResult);
    });
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
    this.modalMode = 'create';
    this.currentCategoryId = null;
    this.newCartegoryForm.reset();
    this.newCartegoryForm.patchValue({ status: 'true' }); // Set default status for new entry
    this.currentCategoryData.set(null); // Clear data when creating
    if (this.modalContent) {
      this.open(this.modalContent);
    } else {
      console.error("Modal content reference ('createCategoryModal') not found in template.");
    }
  }

  /**
   * Fetches a single category by ID and patches the form.
   */
  private fetchCategoryData(categoryId: number): void {
    this.isLoading.set(true);
    this.http.get<ProductCategory>(`${this.categoryUrl}${categoryId}/`)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.currentCategoryData.set(data);
          // Patch the form. Boolean values must be converted to string 'true'/'false'
          // because the HTML select input expects string values.
          this.newCartegoryForm.patchValue({
            name: data.name,
            description: data.description,
            is_digital: String(data.is_digital),
            status: String(data.status), // ADDED: Patch status
          });

          // Open the modal after data is successfully loaded and patched
          if (this.modalContent) {
            this.open(this.modalContent);
          }
        },
        error: (err) => {
          this.message.set('Failed to load category data for editing.');
          console.error('Error fetching category:', err);
          this.isLoading.set(false); // Stop loading indicator
        }
      });
  }

  /**
   * Sets the modal to 'edit' mode, saves the ID, fetches the data, and opens the modal.
   */
  handleEditModal(categoryId: number): void {
    this.modalMode = 'edit';
    this.currentCategoryId = categoryId;
    this.newCartegoryForm.reset(); // Reset form before patching
    this.message.set(null); // Clear previous messages

    // Fetch data and patch the form
    this.fetchCategoryData(categoryId);
    // The modal is opened inside fetchCategoryData upon success
  }

  /**
   * Sets the modal to 'delete' mode, saves the ID, and opens the modal.
   * Now opens the new delete confirmation modal.
   */
  handleDeleteModal(categoryId: number): void {
    this.modalMode = 'delete';
    this.currentCategoryId = categoryId;
    this.message.set(null); // Clear messages before delete

    if (this.deleteModalContent) { // Use the new delete modal reference
      this.open(this.deleteModalContent);
    }
  }

  // --- FORM SUBMISSION (Add/Edit) ---

  onAdd(): void {
    this.message.set(null);
    this.isLoading.set(true);

    if (this.newCartegoryForm.invalid) {
      this.newCartegoryForm.markAllAsTouched();
      this.isLoading.set(false);
      return;
    }

    const formValue = this.newCartegoryForm.getRawValue();
    const url = (this.modalMode === 'edit' && this.currentCategoryId)
      ? `${this.baseUrl}/categories/${this.currentCategoryId}/`
      : `${this.baseUrl}/categories/`;
    const httpMethod = (this.modalMode === 'edit' && this.currentCategoryId) ?
      this.http.put(url, formValue) :
      this.http.post(url, formValue);

    httpMethod.pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res: any) => {
        console.log(`Cartegory ${this.modalMode}ed successfully`);

        // Reload data from the first page after successful operation
        this.loadAll(`${this.categoryUrl}?page=1&page_size=${this.pageSize}`);
        this.currentPage = 1; // Reset to page 1

        this.router.navigate(['/dashboards/cartegories'], {});
        this.modalService.dismissAll('saved');
      },
      error: err => {
        const errors = err?.error;
        if (errors && typeof errors === 'object') {
          Object.keys(errors).forEach(field => {
            const control = this.newCartegoryForm.get(field);
            if (control) {
              control.setErrors({ serverError: errors[field][0] });
            }
          });
        } else {
          this.message.set('An unexpected error occurred. Please try again.');
          console.error('Unexpected operation error:', err);
        }
      }
    });
  }

  /**
   * Confirms and performs the DELETE request.
   */
  onDelete(): void {
    this.message.set(null);
    if (!this.currentCategoryId) {
      this.message.set('Error: No category selected for deletion.');
      return;
    }

    this.isLoading.set(true);
    const url = `${this.baseUrl}/categories/${this.currentCategoryId}/`;

    this.http.delete(url)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: () => {
          console.log('Cartegory deleted successfully');

          // Reload data and reset to page 1
          this.loadAll(`${this.categoryUrl}?page=1&page_size=${this.pageSize}`);
          this.currentPage = 1;

          this.modalService.dismissAll('deleted');
        },
        error: (err) => {
          this.message.set('Failed to delete the category. Please try again.');
          console.error('Deletion error:', err);
        }
      });
  }

  actionButtons: ActionButton[] = [
    {
      text: 'Create New',
      icon: faPlus,
      class: 'btn-success',
      onClick: this.handleCreateModal
    }
  ];
}
