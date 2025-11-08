import { Component, signal, WritableSignal, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { FormBuilder, FormGroup, Validators, FormControl, NonNullableFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { faStar, faPlus, faEdit, faTrash, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ActionButton } from '../../../Layout/Components/page-title/page-title.component';

// --- Interface Definitions (Unchanged) ---

interface BaseSetupItem { id?: number; name: string; }
export interface Brand extends BaseSetupItem { description: string; status: boolean; is_digital: boolean; }
export interface ProductCategory extends BaseSetupItem { description: string; status: boolean; is_digital: boolean; }
export interface ScreenSize extends BaseSetupItem {}
export interface SupportedResolution extends BaseSetupItem {}
export interface PanelType extends BaseSetupItem {}
export interface Connectivity extends BaseSetupItem {}
export interface SupportedInternetService extends BaseSetupItem {}

export interface ProductSpecification {
    id?: number;
    sku: string;
    product: number;
    screen_size: number;
    resolution: number;
    panel_type: number;
    original_price: number;
    sale_price: number;
    color: string | null;
    smart_features: boolean;
    supported_internet_services: number[];
    screen_size_detail?: ScreenSize;
    resolution_detail?: SupportedResolution;
    panel_type_detail?: PanelType;
}

export interface Product {
    id?: number;
    name: string;
    description: string;
    brand: number;
    category: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    brand_detail?: Brand;
    category_detail?: ProductCategory;
    product_specs?: ProductSpecification[];
}

// --- Form Definitions (Unchanged) ---

// Form for Base Product CRUD
export interface ProductBaseForm {
    name: FormControl<string>;
    description: FormControl<string>;
    brand: FormControl<number | null>;
    category: FormControl<number | null>;
    is_active: FormControl<string>; // 'true' or 'false'
}

// Form for single Specification CRUD
export interface ProductSpecForm {
    id: FormControl<number | null>; // Spec ID for updates/deletes
    sku: FormControl<string>;
    screen_size: FormControl<number | null>;
    resolution: FormControl<number | null>;
    panel_type: FormControl<number | null>;
    original_price: FormControl<number | null>;
    sale_price: FormControl<number | null>;
    color: FormControl<string | null>;
    smart_features: FormControl<string>; // 'true' or 'false'
    // M2M is handled via the separate `selectedInternetServices` signal
}


@Component({
    selector: 'app-products',
    standalone: false,
    templateUrl: './products.html',
    styleUrl: './products.scss',
})
export class Products implements OnInit {

    heading = 'Products Dashboard';
    subheading = 'Manage Catalogy for your Business .';
    icon = 'pe-7s-box2 icon-gradient bg-happy-green';

    currentJustify = 'start';
    isLoading: WritableSignal<boolean> = signal(false);
    message: WritableSignal<string | null> = signal(null);
    closeResult = '';

    http = inject(HttpClient);
    private router = inject(Router);
    private formBuilder = inject(NonNullableFormBuilder);
    constructor(private modalService: NgbModal) {}

    // Icon declarations
    faTrash = faTrash;
    faPlus = faPlus;
    faEdit = faEdit;

    private baseUrl = 'http://localhost:8000/api';
    private productUrl = `${this.baseUrl}/products/management/`;
    private setupUrl = `${this.baseUrl}/setups`;

    @ViewChild('productModal') productModal: ElementRef | undefined;
    @ViewChild('deleteProductModal') deleteProductModal: ElementRef | undefined;

    // Spec Modals
    @ViewChild('specModal') specModal: ElementRef | undefined;
    @ViewChild('deleteSpecModal') deleteSpecModal: ElementRef | undefined;

    // Product CRUD state
    modalMode: 'create' | 'edit' | 'delete' | 'create-spec' | 'edit-spec' = 'create'; // Added spec modes
    currentProductId: number | null = null;
    // RENAMED and USED FOR PARENT DATA ACCESS
    currentProduct: WritableSignal<Product | null> = signal(null);

    // Spec CRUD state
    currentSpecId: number | null = null;
    currentSpecProductParentId: number | null = null;

    availableInternetServices: WritableSignal<SupportedInternetService[]> = signal([]);
    selectedInternetServices: WritableSignal<number[]> = signal([]);

    products: WritableSignal<Product[]> = signal([]);
    brands: WritableSignal<Brand[]> = signal([]);
    categories: WritableSignal<ProductCategory[]> = signal([]);
    screenSizes: WritableSignal<ScreenSize[]> = signal([]);
    resolutions: WritableSignal<SupportedResolution[]> = signal([]);
    panelTypes: WritableSignal<PanelType[]> = signal([]);

    // Forms remain the same
    productForm: FormGroup<ProductBaseForm> = this.formBuilder.group({
        name: ['', [Validators.required]],
        description: ['', [Validators.required]],
        brand: [null as number | null, [Validators.required]],
        category: [null as number | null, [Validators.required]],
        is_active: ['true', [Validators.required]],
    });

    specForm: FormGroup<ProductSpecForm> = this.formBuilder.group({
        id: [null as number | null],
        sku: ['', [Validators.required, Validators.maxLength(50)]],
        screen_size: [null as number | null, [Validators.required]],
        resolution: [null as number | null, [Validators.required]],
        panel_type: [null as number | null, [Validators.required]],
        original_price: [null as number | null, [Validators.required, Validators.min(0)]],
        sale_price: [null as number | null, [Validators.required, Validators.min(0)]],
        color: [null as string | null],
        smart_features: ['false', [Validators.required]],
    }) as FormGroup<ProductSpecForm>;

    ngOnInit(): void {
        this.loadInitialData();
    }

    // --- NEW HELPER: Generates the correct nested API URL ---
    private getSpecsBaseUrl(productId: number | string): string {
        // Format: /api/products/management/{product_id}/specs/
        return `${this.productUrl}${productId}/specs/`;
    }

    // Lookups remain the same
    public lookupBrandName(brandId: number): string {
        const brand = this.brands().find(b => b.id === brandId);
        return brand ? brand.name : 'N/A';
    }

    public lookupCategoryName(categoryId: number): string {
        const category = this.categories().find(c => c.id === categoryId);
        return category ? category.name : 'N/A';
    }

    // RENAMED from loadInitialData for consistency when called after an operation
    refreshProducts(): void {
        this.loadInitialData();
    }


    loadInitialData(): void {
        this.isLoading.set(true);
        this.message.set(null);

        const products$ = this.http.get<Product[]>(this.productUrl);
        const brands$ = this.http.get<Brand[]>(`${this.setupUrl}/brands/`);
        const categories$ = this.http.get<ProductCategory[]>(`${this.setupUrl}/categories/`);
        const sizes$ = this.http.get<ScreenSize[]>(`${this.setupUrl}/screen-sizes/`);
        const resolutions$ = this.http.get<SupportedResolution[]>(`${this.setupUrl}/resolutions/`);
        const panels$ = this.http.get<PanelType[]>(`${this.setupUrl}/panel-types/`);
        const internetServices$ = this.http.get<SupportedInternetService[]>(`${this.setupUrl}/internet-services/`);

        forkJoin({
            products: products$,
            brands: brands$,
            categories: categories$,
            screenSizes: sizes$,
            resolutions: resolutions$,
            panelTypes: panels$,
            internetServices: internetServices$
        })
        .pipe(
            finalize(() => this.isLoading.set(false))
        )
        .subscribe({
            next: (results) => {
                this.products.set(results.products);
                this.brands.set(results.brands);
                this.categories.set(results.categories);
                this.screenSizes.set(results.screenSizes);
                this.resolutions.set(results.resolutions);
                this.panelTypes.set(results.panelTypes);
                this.availableInternetServices.set(results.internetServices);
            },
            error: (err) => {
                this.message.set('Failed to load initial data.');
                console.error('Initial data load error:', err);
            }
        });
    }

    openModal(content: any | null, size: 'sm' | 'lg' | 'xl' | 'md' = 'lg'){
        if (!content) {
            console.error("Modal content is null/undefined.");
            return;
        }
        this.modalService.open(content, { centered: true, size: size }).result.then((result) => {
            this.closeResult = `Closed with: ${result}`;
            if (result === 'saved' || result === 'deleted') {
                // Reload data upon successful operation in either modal
                this.refreshProducts();
            }
        }, (reason) => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });
    }

    private getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) { return 'by pressing ESC'; }
        if (reason === ModalDismissReasons.BACKDROP_CLICK) { return 'by clicking on a backdrop'; }
        return `with: ${reason}`;
    }


    // ----------------------------------------------------------------------
    // --- STAGE 1: BASE PRODUCT CRUD (Using productForm) ---------------------
    // ----------------------------------------------------------------------

    /** Opens modal for creating a new product. */
    handleCreateProductModal(): void {
        this.modalMode = 'create';
        this.currentProductId = null;
        this.productForm.reset();
        this.productForm.patchValue({ is_active: 'true', brand: null, category: null });
        this.currentProduct.set(null); // Clear parent product data
        if (this.productModal) this.openModal(this.productModal, 'lg');
    }

    /** Opens modal for editing an existing product. */
    handleEditProductModal(productId: number): void {
        this.modalMode = 'edit';
        this.currentProductId = productId;
        this.productForm.reset();
        this.message.set(null);
        this.isLoading.set(true);

        this.http.get<Product>(`${this.productUrl}${productId}/`)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
            next: (data) => {
                this.currentProduct.set(data); // Store the product data
                this.productForm.patchValue({
                    name: data.name,
                    description: data.description,
                    brand: data.brand,
                    category: data.category,
                    is_active: String(data.is_active),
                });
                if (this.productModal) this.openModal(this.productModal, 'lg');
            },
            error: (err) => {
                this.message.set('Failed to load product data for editing.');
                console.error('Error fetching product:', err);
            }
        });
    }


    /** Submits the base product form (Create/Update). */
    onAddProduct(): void {
      this.message.set(null);
      this.isLoading.set(true);

      if (this.productForm.invalid) {
          this.productForm.markAllAsTouched();
          this.isLoading.set(false);
          return;
      }

      const rawValue = this.productForm.getRawValue();

      // Payload only includes base fields
      const payload = {
          name: rawValue.name,
          description: rawValue.description,
          brand: Number(rawValue.brand),
          category: Number(rawValue.category),
          is_active: rawValue.is_active === 'true',
      };

      const url = (this.modalMode === 'edit' && this.currentProductId)
          ? `${this.productUrl}${this.currentProductId}/`
          : this.productUrl;

      const httpMethod = (this.modalMode === 'edit' && this.currentProductId) ?
          this.http.put(url, payload) :
          this.http.post<Product>(url, payload);

      httpMethod.pipe(
          finalize(() => this.isLoading.set(false))
      ).subscribe({
          next: (response: Product) => {
                // 🌟 FIX: Store the full product response here for Spec Modal context
                this.currentProduct.set(response);
                this.modalService.dismissAll('saved');

                if (this.modalMode === 'create' && response.id) {
                    this.message.set(`Product "${response.name}" created successfully. Now, add specifications (SKUs).`);
                    this.handleCreateSpecModal(response.id);
                }
                else if (this.modalMode === 'edit') {
                    this.message.set(`Product "${response.name}" updated successfully.`);
                }

                this.refreshProducts();
          },
          error: err => this.handleFormError(err, this.productForm)
      });
  }

    /** Opens confirmation modal for deleting a product. */
    handleDeleteProductModal(productId: number): void {
        this.modalMode = 'delete';
        this.currentProductId = productId;
        this.message.set(null);
        if (this.deleteProductModal) this.openModal(this.deleteProductModal, 'sm');
    }

    /** Executes the deletion of the product. */
    onDeleteProduct(): void {
        this.message.set(null);
        if (!this.currentProductId) return;

        this.isLoading.set(true);
        const url = `${this.productUrl}${this.currentProductId}/`;

        this.http.delete(url)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: () => this.modalService.dismissAll('deleted'),
                error: (err) => {
                    this.message.set('Failed to delete the product.');
                    console.error('Deletion error:', err);
                }
            });
    }


    // ----------------------------------------------------------------------
    // --- STAGE 2: SPECIFICATION CRUD (Using specForm) -----------------------
    // ----------------------------------------------------------------------

    /** Opens modal for creating a new specification for a given product ID. */
    handleCreateSpecModal(productId: number): void {
        this.modalMode = 'create-spec'; // Use dedicated mode
        this.currentSpecId = null;
        this.currentSpecProductParentId = productId;
        this.specForm.reset();
        this.specForm.patchValue({ smart_features: 'false', id: null, screen_size: null, resolution: null, panel_type: null });
        this.selectedInternetServices.set([]); // Reset M2M selection

        if (this.specModal) this.openModal(this.specModal, 'lg');
    }

    /** Opens modal for editing an existing specification. */
    handleEditSpecModal(specId: number, productId: number): void {
        this.modalMode = 'edit-spec'; // Use dedicated mode
        this.currentSpecId = specId;
        this.currentSpecProductParentId = productId;
        this.specForm.reset();
        this.message.set(null);
        this.isLoading.set(true);

        // Try to find the spec data in the already loaded signal data
        const product = this.products().find(p => p.id === productId);
        const specData = product?.product_specs?.find(s => s.id === specId);

        // Load the current product data into this.currentProduct for context access
        if (product) {
            this.currentProduct.set(product);
        }

        if (specData) {
            this.patchSpecForm(specData);
            this.isLoading.set(false);
            if (this.specModal) this.openModal(this.specModal, 'lg');
        } else {
            // Fall back to fetching the individual spec from the *dedicated* endpoint
            const url = `${this.getSpecsBaseUrl(productId)}${specId}/`;
            this.http.get<ProductSpecification>(url)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (data) => {
                    this.patchSpecForm(data);
                    if (this.specModal) this.openModal(this.specModal, 'lg');
                },
                error: (err) => {
                    this.message.set('Failed to load specification data for editing.');
                    console.error('Error fetching spec:', err);
                }
            });
        }
    }

    /** Helper to patch the spec form and set M2M services. */
    private patchSpecForm(specData: ProductSpecification): void {
        this.specForm.patchValue({
            id: specData.id || null,
            sku: specData.sku,
            screen_size: specData.screen_size,
            resolution: specData.resolution,
            panel_type: specData.panel_type,
            original_price: specData.original_price,
            sale_price: specData.sale_price,
            color: specData.color,
            smart_features: String(specData.smart_features),
        });
        this.selectedInternetServices.set(specData.supported_internet_services || []);
    }


    /** Submits the single specification form (Create/Update). */
    onAddProductSpec(): void {
      this.message.set(null);
      this.isLoading.set(true);

      // Validate form and ensure we have parent product context
      if (this.specForm.invalid || !this.currentSpecProductParentId) {
          this.specForm.markAllAsTouched();
          this.isLoading.set(false);
          return;
      }

      const rawValue = this.specForm.getRawValue();

      // Specification Payload (Clean, without base product fields)
      const payload = {
          sku: rawValue.sku,
          color: rawValue.color,
          smart_features: rawValue.smart_features === 'true',
          screen_size: Number(rawValue.screen_size),
          resolution: Number(rawValue.resolution),
          panel_type: Number(rawValue.panel_type),
          original_price: Number(rawValue.original_price),
          sale_price: Number(rawValue.sale_price),
          supported_internet_services: this.selectedInternetServices(),
            // NOTE: 'product' is NOT needed in payload if URL handles nesting,
            // but including it here for robustness if the ViewSet requires it.
            product: this.currentSpecProductParentId,
      };

      // Determine URL and HTTP Method using the correct NESTED structure
      let httpMethod: Observable<any>;
      const baseSpecUrl = this.getSpecsBaseUrl(this.currentSpecProductParentId);

      if (this.modalMode === 'edit-spec' && rawValue.id) {
          // EDIT: PUT to /products/{id}/specs/{spec_id}/
          const specUrl = `${baseSpecUrl}${rawValue.id}/`;
          httpMethod = this.http.put(specUrl, payload);
          this.message.set(`Specification (SKU: ${rawValue.sku}) updated successfully.`);

      } else { // 'create-spec'
          // CREATE: POST to /products/{id}/specs/
          httpMethod = this.http.post(baseSpecUrl, payload);
          this.message.set(`New specification created for Product ID ${this.currentSpecProductParentId}.`);
      }

      httpMethod.pipe(
          finalize(() => this.isLoading.set(false))
      ).subscribe({
          next: () => {
                this.modalService.dismissAll('saved');
                this.refreshProducts(); // Reload data to show new spec
            },
          error: err => this.handleFormError(err, this.specForm)
      });
  }


    /** Opens confirmation modal for deleting a specification. */
    handleDeleteSpecModal(specId: number, productId: number): void {
        this.modalMode = 'delete';
        this.currentSpecId = specId;
        this.currentSpecProductParentId = productId;
        this.message.set(null);
        if (this.deleteSpecModal) this.openModal(this.deleteSpecModal, 'sm');
    }

    /** Executes the deletion of the specification. */
    onDeleteSpec(): void {
        this.message.set(null);
        if (!this.currentSpecId || !this.currentSpecProductParentId) return;

        this.isLoading.set(true);
        // FIX: Use the nested URL structure for deletion
        const baseSpecUrl = this.getSpecsBaseUrl(this.currentSpecProductParentId);
        const url = `${baseSpecUrl}${this.currentSpecId}/`;

        this.http.delete(url)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: () => this.modalService.dismissAll('deleted'),
                error: (err) => {
                    this.message.set('Failed to delete the specification.');
                    console.error('Deletion error:', err);
                }
            });
    }


    // ----------------------------------------------------------------------
    // --- UTILITIES --------------------------------------------------------
    // ----------------------------------------------------------------------

    private handleFormError(err: any, form: FormGroup): void {
        this.isLoading.set(false);
        const errors = err?.error;
        if (errors && typeof errors === 'object') {
            Object.keys(errors).forEach(field => {
                const control = form.get(field);
                if (control) {
                    control.setErrors({ serverError: Array.isArray(errors[field]) ? errors[field][0] : errors[field] });
                }
            });
            this.message.set('Please correct the highlighted form errors.');
        } else {
            this.message.set('An unexpected error occurred. Please try again.');
            console.error('Unexpected operation error:', err);
        }
    }


    toggleInternetServiceSelection(id: number): void {
        this.selectedInternetServices.update(currentIds => {
            const index = currentIds.indexOf(id);
            if (index > -1) {
                return currentIds.filter(i => i !== id);
            } else {
                return [...currentIds, id];
            }
        });
    }

    handleCreateModal = () => {
        this.handleCreateProductModal();
    }


    actionButtons: ActionButton[] = [
        {
            text: 'Create New Product',
            icon: faPlus,
            class: 'btn-success',
            onClick: this.handleCreateModal
        }
    ];
}
