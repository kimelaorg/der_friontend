import { Component, signal, WritableSignal, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { FormBuilder, FormGroup, Validators, FormControl, NonNullableFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { faStar, faPlus, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { NgIf, NgFor, CommonModule, DatePipe } from '@angular/common';
import { ActionButton } from '../../../Layout/Components/page-title/page-title.component';
import {
    Brand,
    SupportedInternetService,
    SupportedResolution,
    ScreenSize,
    PanelType,
    Connectivity
} from './spec';



export interface BrandForm {
  name: FormControl<string>;
  description: FormControl<string>;
}

export interface SupportedInternetServiceForm {
  name: FormControl<string>;
}

export interface SupportedResolutionForm {
  name: FormControl<string>;
}

export interface ScreenSizeForm {
  name: FormControl<string>;
}

export interface PanelTypeForm {
  name: FormControl<string>;
}

export interface ConnectivityForm {
  name: FormControl<string>;
}

@Component({
  selector: 'app-specifications',
  standalone: false,
  templateUrl: './specifications.html',
  styleUrl: './specifications.scss',
})
export class Specifications implements OnInit {

  http = inject(HttpClient);
  private router = inject(Router);
  private formBuilder = inject(NonNullableFormBuilder);
  constructor(private modalService: NgbModal) {}

  private baseUrl = 'http://localhost:8000/api/setups';
  heading = 'Product Specifications';
  subheading = 'Manage Specifications related to your Business Products.';
  icon = 'pe-7s-config icon-gradient bg-strong-bliss';

  currentBrandId: number | null = null;
  currentSupportedInternetServiceId: number | null = null;
  currentSupportedResolutionId: number | null = null;
  currentPanelTypeId: number | null = null;
  currentConnectivityId: number | null = null;
  modalMode: 'create' | 'edit' | 'delete' = 'create';

  message: WritableSignal<string | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(false);
  closeResult = '';

  brands: WritableSignal<Brand[]> = signal([]);
  internetServices: WritableSignal<SupportedInternetService[]> = signal([]);
  resolutions: WritableSignal<SupportedResolution[]> = signal([]);
  panelTypes: WritableSignal<PanelType[]> = signal([]);
  connectivityOptions: WritableSignal<Connectivity[]> = signal([]);
  screenSizes: WritableSignal<ScreenSize[]> = signal([]);

  newBrandForm: FormGroup<BrandForm> = this.formBuilder.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
  });

  newSupportedInternetServiceForm: FormGroup<SupportedInternetServiceForm> = this.formBuilder.group({
    name: ['', [Validators.required]],
  });

  newSupportedResolutionForm: FormGroup<SupportedResolutionForm> = this.formBuilder.group({
    name: ['', [Validators.required]],
  });

  newPanelTypeForm: FormGroup<PanelTypeForm> = this.formBuilder.group({
    name: ['', [Validators.required]],
  });

  newScreenSizeForm: FormGroup<ScreenSizeForm> = this.formBuilder.group({
    name: ['', [Validators.required]],
  });

  newConnectivityForm: FormGroup<ConnectivityForm> = this.formBuilder.group({
    name: ['', [Validators.required]],
  });

  @ViewChild('brandModal') brandModal: ElementRef | undefined;
  @ViewChild('deleteBrandConfirmationModal') deleteBrandConfirmationModal: ElementRef | undefined;

  ngOnInit(): void {
    this.loadAllSetupData();
  }

  loadAllSetupData(): void {
    this.isLoading.set(true);
    this.message.set(null);

    const brand$ = this.http.get<Brand[]>(`${this.baseUrl}/brands/`);
    const internetService$ = this.http.get<SupportedInternetService[]>(`${this.baseUrl}/internet-services/`);
    const resolution$ = this.http.get<SupportedResolution[]>(`${this.baseUrl}/resolutions/`);
    const panelType$ = this.http.get<PanelType[]>(`${this.baseUrl}/panel-types/`);
    const connectivity$ = this.http.get<Connectivity[]>(`${this.baseUrl}/connectivity/`);
    const screenSize$ = this.http.get<ScreenSize[]>(`${this.baseUrl}/screen-sizes/`);

    forkJoin({
      brands: brand$,
      internetServices: internetService$,
      resolutions: resolution$,
      panelTypes: panelType$,
      connectivityOptions: connectivity$,
      screenSizes: screenSize$
    })
    .pipe(
      finalize(() => this.isLoading.set(false))
    )
    .subscribe({
      next: (results) => {
        this.brands.set(results.brands);
        this.internetServices.set(results.internetServices);
        this.resolutions.set(results.resolutions);
        this.panelTypes.set(results.panelTypes);
        this.connectivityOptions.set(results.connectivityOptions);
        this.screenSizes.set(results.screenSizes);

        this.message.set('All setup data loaded successfully.');
      },
      error: (err) => {
        this.message.set('Failed to load one or more product setup data lists.');
        console.error('Multi-load error:', err);
      }
    });
  }

  open(content: any | null){
    this.modalService.open(content, { centered: true }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;

      if (result === 'saved' || result === 'deleted') {
        // Reload all data after a successful operation
        this.loadAllSetupData();
      }
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
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

  // --- BRAND CRUD METHODS ---

  /**
   * Prepares the modal for a new brand entry (CREATE initiation).
   */
  handleCreateModalBrand = () => {
    this.modalMode = 'create';
    this.currentBrandId = null;
    this.newBrandForm.reset();
    this.brands.set(null);

    if (this.brandModal) {
      this.open(this.brandModal);
    } else {
      console.error("Brand modal content reference ('brandModal') not found in template.");
    }
  }

  /**
   * Fetches a single brand by ID and patches the form (READ Single for Edit).
   */
  private fetchBrandData(brandId: number): void {
    this.isLoading.set(true);
    this.message.set(null);
    this.http.get<any>(`${this.baseUrl}/brands/${this.currentBrandId}/`)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.brands.set(data);
          // Patch the form. Convert boolean values to string for form controls.
          this.newBrandForm.patchValue({
            name: data.name,
            description: data.description,
          });

          // Open the modal after data is successfully loaded and patched
          if (this.brandModal) {
            this.open(this.brandModal);
          }
        },
        error: (err) => {
          this.message.set('Failed to load brand data for editing.');
          console.error('Error fetching brand:', err);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Sets the modal to 'edit' mode, saves the ID, fetches the data, and opens the modal (UPDATE initiation).
   */
  handleEditModalBrand(brandId: number): void {
    this.modalMode = 'edit';
    this.currentBrandId = brandId;
    this.newBrandForm.reset(); // Reset form before patching
    this.message.set(null); // Clear previous messages

    this.fetchBrandData(brandId);
  }

  /**
   * Sets the modal to 'delete' mode, saves the ID, and opens the modal (DELETE initiation).
   */
  handleDeleteModalBrand(brandId: number): void {
    this.modalMode = 'delete';
    this.currentBrandId = brandId;
    this.message.set(null); // Clear messages before delete

    if (this.deleteBrandConfirmationModal) {
      this.open(this.deleteBrandConfirmationModal);
    }
  }

  /**
   * Handles both CREATE (POST) and UPDATE (PUT) requests for a Brand.
   */
  onAddBrand(): void {
    this.message.set(null);
    this.isLoading.set(true);

    if (this.newBrandForm.invalid) {
      this.newBrandForm.markAllAsTouched();
      this.isLoading.set(false);
      return;
    }

    const brandUrl: string = `${this.baseUrl}/brands/`
    const formValue = this.newBrandForm.getRawValue();
    const url = (this.modalMode === 'edit' && this.currentBrandId)
      ? `${brandUrl}/${this.currentBrandId}/`
      : `${brandUrl}/${this.currentBrandId}/`;
    const httpMethod = (this.modalMode === 'edit' && this.currentBrandId) ?
      this.http.put(url, formValue) :
      this.http.post(url, formValue);

    httpMethod.pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res: any) => {
        console.log(`Brand ${this.modalMode}ed successfully`);
        this.modalService.dismissAll('saved');
      },
      error: err => {
        const errors = err?.error;
        if (errors && typeof errors === 'object') {
          // Display server errors on form fields if possible
          Object.keys(errors).forEach(field => {
            const control = this.newBrandForm.get(field);
            if (control) {
              control.setErrors({ serverError: errors[field][0] });
            }
          });
          this.message.set('Form validation failed due to server errors.');
        } else {
          this.message.set('An unexpected error occurred. Please try again.');
          console.error('Unexpected operation error:', err);
        }
      }
    });
  }

  /**
   * Confirms and performs the DELETE request for a Brand.
   */
  onDeleteBrand(): void {
    this.message.set(null);
    if (!this.currentBrandId) {
      this.message.set('Error: No brand selected for deletion.');
      return;
    }

    this.isLoading.set(true);
    const url = `${this.baseUrl}/brands/${this.currentBrandId}/`;

    this.http.delete(url)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: () => {
          console.log('Brand deleted successfully');
          this.modalService.dismissAll('deleted');
        },
        error: (err) => {
          this.message.set('Failed to delete the brand. Please try again.');
          console.error('Deletion error:', err);
        }
      });
  }

}
