import { Component, signal, WritableSignal, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { FormBuilder, FormGroup, Validators, FormControl, NonNullableFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { finalize, catchError, map } from 'rxjs/operators';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { faStar, faPlus, IconDefinition, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { NgIf, NgFor, CommonModule, DatePipe } from '@angular/common';

// Assuming this path and interface structure
import { ActionButton } from '../../../Layout/Components/page-title/page-title.component';
import {
    Brand,
    SupportedInternetService,
    SupportedResolution,
    ScreenSize,
    PanelType,
    Connectivity
} from './spec';

// --- Type Interfaces for Forms and Data ---

// Base interface for all simple specification models
interface BaseSpec {
    id?: number;
    name: string;
}

// Interfaces for form groups
export interface BrandForm {
    name: FormControl<string>;
    description: FormControl<string>;
}

export interface SimpleSpecForm {
    name: FormControl<string>;
}

// Type map for dynamic form/data access
type SpecType = 'Brand' | 'InternetService' | 'Resolution' | 'PanelType' | 'Connectivity' | 'ScreenSize';

interface SpecMap {
    Brand: { form: FormGroup<BrandForm>, data: WritableSignal<Brand[]>, apiUrl: string, key: string, nameField: 'name' };
    InternetService: { form: FormGroup<SimpleSpecForm>, data: WritableSignal<SupportedInternetService[]>, apiUrl: string, key: string, nameField: 'name' };
    Resolution: { form: FormGroup<SimpleSpecForm>, data: WritableSignal<SupportedResolution[]>, apiUrl: string, key: string, nameField: 'name' };
    PanelType: { form: FormGroup<SimpleSpecForm>, data: WritableSignal<PanelType[]>, apiUrl: string, key: string, nameField: 'name' };
    Connectivity: { form: FormGroup<SimpleSpecForm>, data: WritableSignal<Connectivity[]>, apiUrl: string, key: string, nameField: 'name' };
    ScreenSize: { form: FormGroup<SimpleSpecForm>, data: WritableSignal<ScreenSize[]>, apiUrl: string, key: string, nameField: 'name' };
}

@Component({
    selector: 'app-specifications',
    standalone: false,
    templateUrl: './specifications.html',
    styleUrl: './specifications.scss',
})
export class Specifications implements OnInit {

    // --- Dependency Injection ---
    http = inject(HttpClient);
    private router = inject(Router);
    private formBuilder = inject(NonNullableFormBuilder);
    constructor(private modalService: NgbModal) { }

    // --- Component Constants ---
    private baseUrl = 'http://localhost:8000/api/setups';
    heading = 'Product Specifications';
    subheading = 'Manage Specifications related to your Business Products.';
    icon = 'pe-7s-config icon-gradient bg-strong-bliss';

    // --- Font Awesome Icons ---
    faPlus = faPlus;
    faEdit = faEdit;
    faTrash = faTrash;

    // --- State Variables ---
    currentSpecId: number | null = null;
    currentSpecType: SpecType | null = null;
    modalMode: 'create' | 'edit' | 'delete' = 'create';
    message: WritableSignal<string | null> = signal(null);
    isLoading: WritableSignal<boolean> = signal(false);
    closeResult = '';

    // --- Data Holders (Signals for change detection) ---
    brands: WritableSignal<Brand[]> = signal([]);
    internetServices: WritableSignal<SupportedInternetService[]> = signal([]);
    resolutions: WritableSignal<SupportedResolution[]> = signal([]);
    panelTypes: WritableSignal<PanelType[]> = signal([]);
    connectivityOptions: WritableSignal<Connectivity[]> = signal([]);
    screenSizes: WritableSignal<ScreenSize[]> = signal([]);

    // --- Form Groups ---
    newBrandForm: FormGroup<BrandForm> = this.formBuilder.group({
        name: ['', [Validators.required]],
        description: ['', [Validators.required]],
    });

    newSupportedInternetServiceForm: FormGroup<SimpleSpecForm> = this.formBuilder.group({
        name: ['', [Validators.required]],
    });

    newSupportedResolutionForm: FormGroup<SimpleSpecForm> = this.formBuilder.group({
        name: ['', [Validators.required]],
    });

    newPanelTypeForm: FormGroup<SimpleSpecForm> = this.formBuilder.group({
        name: ['', [Validators.required]],
    });

    newScreenSizeForm: FormGroup<SimpleSpecForm> = this.formBuilder.group({
        name: ['', [Validators.required]],
    });

    newConnectivityForm: FormGroup<SimpleSpecForm> = this.formBuilder.group({
        name: ['', [Validators.required]],
    });

    // --- ViewChildren for Modals (Used in HTML template) ---
    @ViewChild('editCreateModal') editCreateModal: ElementRef | undefined;
    @ViewChild('deleteConfirmationModal') deleteConfirmationModal: ElementRef | undefined;

    // --- SpecMap for Dynamic Access ---
    specMap: SpecMap = {
        Brand: { form: this.newBrandForm, data: this.brands, apiUrl: `${this.baseUrl}/brands/`, key: 'brands', nameField: 'name' },
        InternetService: { form: this.newSupportedInternetServiceForm, data: this.internetServices, apiUrl: `${this.baseUrl}/internet-services/`, key: 'internetServices', nameField: 'name' },
        Resolution: { form: this.newSupportedResolutionForm, data: this.resolutions, apiUrl: `${this.baseUrl}/resolutions/`, key: 'resolutions', nameField: 'name' },
        PanelType: { form: this.newPanelTypeForm, data: this.panelTypes, apiUrl: `${this.baseUrl}/panel-types/`, key: 'panelTypes', nameField: 'name' },
        Connectivity: { form: this.newConnectivityForm, data: this.connectivityOptions, apiUrl: `${this.baseUrl}/connectivity/`, key: 'connectivityOptions', nameField: 'name' },
        ScreenSize: { form: this.newScreenSizeForm, data: this.screenSizes, apiUrl: `${this.baseUrl}/screen-sizes/`, key: 'screenSizes', nameField: 'name' },
    };

    // --- Lifecycle Hooks ---

    ngOnInit(): void {
        this.loadAllSetupData();
    }

    // --- Data Loading ---

    loadAllSetupData(): void {
        this.isLoading.set(true);
        this.message.set(null);

        const obsMap = {
            brands: this.http.get<Brand[]>(this.specMap.Brand.apiUrl),
            internetServices: this.http.get<SupportedInternetService[]>(this.specMap.InternetService.apiUrl),
            resolutions: this.http.get<SupportedResolution[]>(this.specMap.Resolution.apiUrl),
            panelTypes: this.http.get<PanelType[]>(this.specMap.PanelType.apiUrl),
            connectivityOptions: this.http.get<Connectivity[]>(this.specMap.Connectivity.apiUrl),
            screenSizes: this.http.get<ScreenSize[]>(this.specMap.ScreenSize.apiUrl),
        };

        forkJoin(obsMap)
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

    // --- Modal Management (Unified) ---

    /**
     * Opens the NgbModal immediately, minimizing delay.
     * @param content The modal template reference.
     * @param type 'saved' or 'deleted' for successful operations.
     */
    open(content: any | null, type?: 'saved' | 'deleted'): void {
        if (!content) {
            console.error("Modal content reference is undefined.");
            return;
        }

        this.modalService.open(content, { centered: true }).result.then((result) => {
            this.closeResult = `Closed with: ${result}`;

            if (result === 'saved' || result === 'deleted' || type === 'saved' || type === 'deleted') {
                this.loadAllSetupData(); // Reload data after success
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

    // --- CRUD Initialization Handlers (Generic) ---

    /**
     * Initializes the modal for Create mode.
     * @param type The type of specification (e.g., 'Brand', 'Resolution').
     */
    handleCreateModal(type: SpecType): void {
        this.currentSpecType = type;
        this.currentSpecId = null;
        this.modalMode = 'create';
        this.message.set(null);

        const specConfig = this.specMap[type];
        specConfig.form.reset(); // Reset the specific form

        // Open modal immediately for perceived speed
        this.open(this.editCreateModal);
    }

    /**
     * Initializes the modal for Edit mode.
     * Opens the modal immediately, then fetches and patches data asynchronously.
     * @param type The type of specification.
     * @param id The ID of the item to edit.
     */
    handleEditModal(type: SpecType, id: number): void {
        this.currentSpecType = type;
        this.currentSpecId = id;
        this.modalMode = 'edit';
        this.message.set(null);

        const specConfig = this.specMap[type];
        specConfig.form.reset(); // Reset form before patching

        // 1. Open modal immediately
        this.open(this.editCreateModal);

        // 2. Fetch data and patch form inside the modal
        this.isLoading.set(true);
        this.http.get<any>(`${specConfig.apiUrl}${id}/`)
            .pipe(
                finalize(() => this.isLoading.set(false)),
                catchError(err => {
                    this.message.set(`Failed to load data for editing ${type}.`);
                    console.error(`Error fetching ${type}:`, err);
                    this.modalService.dismissAll(); // Close modal on error
                    return throwError(() => new Error(err));
                })
            )
            .subscribe((data: any) => {
                this.patchFormForEdit(specConfig.form, data);
            });
    }

    /**
     * Patches the form group dynamically based on the received data.
     * @param form The target FormGroup.
     * @param data The data object from the API.
     */
    private patchFormForEdit(form: FormGroup<any>, data: any): void {
        // Simple patch for all fields present in the data object
        form.patchValue(data);
    }

    /**
     * Initializes the modal for Delete mode.
     * @param type The type of specification.
     * @param id The ID of the item to delete.
     */
    handleDeleteModal(type: SpecType, id: number): void {
        this.currentSpecType = type;
        this.currentSpecId = id;
        this.modalMode = 'delete';
        this.message.set(null);

        // Open modal immediately
        this.open(this.deleteConfirmationModal);
    }

    // --- CRUD Execution (Generic) ---

    /**
     * Handles both CREATE (POST) and UPDATE (PUT) requests for any specification type.
     */
    onAddSpec(): void {
        if (!this.currentSpecType) return;

        this.message.set(null);
        this.isLoading.set(true);

        const specConfig = this.specMap[this.currentSpecType];
        const form = specConfig.form;

        if (form.invalid) {
            form.markAllAsTouched();
            this.isLoading.set(false);
            return;
        }

        const formValue = form.getRawValue();
        const url = (this.modalMode === 'edit' && this.currentSpecId)
            ? `${specConfig.apiUrl}${this.currentSpecId}/`
            : specConfig.apiUrl;

        const httpMethod: Observable<any> = (this.modalMode === 'edit' && this.currentSpecId) ?
            this.http.put(url, formValue) :
            this.http.post(url, formValue);

        httpMethod.pipe(
            finalize(() => this.isLoading.set(false)),
            catchError(err => this.handleApiError(err, form))
        ).subscribe({
            next: () => {
                console.log(`${this.currentSpecType} ${this.modalMode}ed successfully`);
                this.modalService.dismissAll('saved');
            }
        });
    }

    /**
     * Confirms and performs the DELETE request for any specification type.
     */
    onDeleteSpec(): void {
        if (!this.currentSpecType || !this.currentSpecId) {
            this.message.set('Error: No item selected for deletion.');
            return;
        }

        this.message.set(null);
        this.isLoading.set(true);
        const specConfig = this.specMap[this.currentSpecType];
        const url = `${specConfig.apiUrl}${this.currentSpecId}/`;

        this.http.delete(url)
            .pipe(
                finalize(() => this.isLoading.set(false)),
                catchError(err => {
                    this.message.set(`Failed to delete the ${this.currentSpecType}. Please try again.`);
                    console.error('Deletion error:', err);
                    return throwError(() => new Error(err));
                })
            )
            .subscribe({
                next: () => {
                    console.log(`${this.currentSpecType} deleted successfully`);
                    this.modalService.dismissAll('deleted');
                }
            });
    }

    // --- Error Handling ---

    private handleApiError(err: any, form: FormGroup<any>): Observable<never> {
        this.isLoading.set(false);
        const errors = err?.error;
        if (errors && typeof errors === 'object') {
            // Server-side validation errors
            Object.keys(errors).forEach(field => {
                const control = form.get(field);
                if (control) {
                    const errorMsg = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
                    control.setErrors({ serverError: errorMsg });
                }
            });
            this.message.set('Form validation failed due to server errors. Please correct the fields.');
        } else {
            // General network/server error
            this.message.set('An unexpected error occurred. Please check your connection and try again.');
            console.error('Unexpected API error:', err);
        }
        return throwError(() => new Error('API error handled.'));
    }

}
