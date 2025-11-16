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

// --- Interface Definitions (Updated) ---

interface BaseSetupItem { id?: number; name: string; }
export interface Brand extends BaseSetupItem { description: string; status: boolean; is_digital: boolean; }
export interface ProductCategory extends BaseSetupItem { description: string; status: boolean; is_digital: boolean; }
export interface ScreenSize extends BaseSetupItem {}
export interface SupportedResolution extends BaseSetupItem {}
export interface PanelType extends BaseSetupItem {}
export interface Connectivity extends BaseSetupItem {}
export interface SupportedInternetService extends BaseSetupItem {}

/** Corresponds to ElectricalSpecificationSerializer (Nested One-to-One in Spec) */
export interface ElectricalSpecification {
    id?: number;
    voltage: string;
    wattage: number;
    power_supply_type: string; // Assuming a text field for type
    product?: number; // read_only_fields = ('product',)
}

/** Corresponds to DigitalProductSerializer (Nested One-to-One in Product) */
export interface DigitalProduct {
    id?: number;
    license_type: number;
    fulfillment_method: number;
    // Assuming other required fields like is_downloadable, file_size, etc. are here
    // Per serializer, it includes 'videos' on read, but on write you only send FKs.
    product?: number; // read_only_fields = ('product',)
}

/** Corresponds to ProductSpecificationSerializer */
export interface ProductSpecification {
    id?: number;
    model: string;
    product: number; // Foreign Key to Product ID
    screen_size: number;
    brand: number;
    resolution: number;
    panel_type: number;
    original_price: number;
    sale_price: number;
    color: string | null;
    smart_features: boolean;
    supported_internet_services: number[]; // PrimaryKeyRelatedField (M2M IDs)

    // OneToOne Relationship (Nested in Serializer)
    electrical_specs?: ElectricalSpecification | null; // Nullable for creation

    // Read-only nested details used for display (though not sent back to API)
    screen_size_detail?: ScreenSize;
    resolution_detail?: SupportedResolution;
    panel_type_detail?: PanelType;
}

/** Corresponds to ProductSerializer */
export interface Product {
    id?: number;
    name: string;
    description: string;
    brand: number;
    category: number;
    is_active: boolean;
    created_at?: string; // read_only_fields
    updated_at?: string; // read_only_fields

    // Management API fetches specs/digital_details on retrieve, not list
    product_specs?: ProductSpecification[];
    digital_details?: DigitalProduct;

    brand_detail?: Brand;
    category_detail?: ProductCategory;
}

// --- Form Definitions (Updated) ---

export interface ProductBaseForm {
    name: FormControl<string>;
    description: FormControl<string>;
    // brand: FormControl<number | null>;
    category: FormControl<number | null>;
    is_active: FormControl<string>;
}

export interface ProductSpecForm {
    id: FormControl<number | null>;
    model: FormControl<string>;
    brand: FormControl<number | null>;
    screen_size: FormControl<number | null>;
    resolution: FormControl<number | null>;
    panel_type: FormControl<number | null>;
    original_price: FormControl<number | null>;
    sale_price: FormControl<number | null>;
    color: FormControl<string | null>;
    smart_features: FormControl<string>;

    // Nested ElectricalSpecification fields (must be extracted for payload)
    electrical_specs_voltage: FormControl<string | null>;
    electrical_specs_wattage: FormControl<number | null>;
    electrical_specs_power_supply_type: FormControl<string | null>;
}


@Component({
    selector: 'app-products',
    standalone: false,
    templateUrl: './products.html',
    styleUrl: './products.scss',
})
export class Products implements OnInit {

    heading = 'Products Dashboard';
    subheading = 'Manage Catalog for your Business .';
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

    // API Endpoints
    private baseUrl = 'http://127.0.0.1:8000/api';
    private productUrl = `${this.baseUrl}/products/products/`;
    private specUrl = `${this.baseUrl}/products/specs/`;
    private setupUrl = `${this.baseUrl}/setups`;

    @ViewChild('productModal') productModal: ElementRef | undefined;
    @ViewChild('deleteProductModal') deleteProductModal: ElementRef | undefined;

    @ViewChild('specModal') specModal: ElementRef | undefined;
    @ViewChild('deleteSpecModal') deleteSpecModal: ElementRef | undefined;

    // Product CRUD state
    modalMode: 'create' | 'edit' | 'delete' | 'create-spec' | 'edit-spec' = 'create';
    currentProductId: number | null = null;
    currentProduct: WritableSignal<Product | null> = signal(null);

    // Spec CRUD state
    currentSpecId: number | null = null;
    currentSpecProductParentId: number | null = null;

    availableInternetServices: WritableSignal<SupportedInternetService[]> = signal([]);
    selectedInternetServices: WritableSignal<number[]> = signal([]);

    products: WritableSignal<Product[]> = signal([]);
    specifications: WritableSignal<ProductSpecification[]> = signal([]);
    brands: WritableSignal<Brand[]> = signal([]);
    categories: WritableSignal<ProductCategory[]> = signal([]);
    screenSizes: WritableSignal<ScreenSize[]> = signal([]);
    resolutions: WritableSignal<SupportedResolution[]> = signal([]);
    panelTypes: WritableSignal<PanelType[]> = signal([]);

    // Product Base Form (Unchanged)
    productForm: FormGroup<ProductBaseForm> = this.formBuilder.group({
        name: ['', [Validators.required]],
        description: ['', [Validators.required]],
        category: [null as number | null, [Validators.required]],
        is_active: ['true', [Validators.required]],
    });

    // Product Spec Form (Updated for nested fields)
    specForm: FormGroup<ProductSpecForm> = this.formBuilder.group({
        id: [null as number | null],
        model: ['', [Validators.required, Validators.maxLength(255)]],
        screen_size: [null as number | null, [Validators.required]],
        resolution: [null as number | null, [Validators.required]],
        panel_type: [null as number | null, [Validators.required]],
        original_price: [null as number | null, [Validators.required, Validators.min(0)]],
        sale_price: [null as number | null, [Validators.required, Validators.min(0)]],
        color: [null as string | null],
        brand: [null as number | null, [Validators.required]],
        smart_features: ['false', [Validators.required]],

        // Electrical Specs (Optional fields)
        electrical_specs_voltage: [null as string | null],
        electrical_specs_wattage: [null as number | null],
        electrical_specs_power_supply_type: [null as string | null],
    }) as FormGroup<ProductSpecForm>;

    ngOnInit(): void {
        this.loadInitialData();
    }

    public lookupBrandName(brandId: number): string {
        const brand = this.brands().find(b => b.id === brandId);
        return brand ? brand.name : 'N/A';
    }

    public lookupCategoryName(categoryId: number): string {
        const category = this.categories().find(c => c.id === categoryId);
        return category ? category.name : 'N/A';
    }

    public lookupProductName(productId: number): string {
        const product = this.products().find(c => c.id === productId);
        return product ? product.name : 'N/A';
    }

    public lookupSizeName(scSizeId: number): string {
        const size = this.screenSizes().find(c => c.id === scSizeId);
        return size ? size.name : 'N/A';
    }

    public lookupResolutionName(resoId: number): string {
        const resolution = this.resolutions().find(c => c.id === resoId);
        return resolution ? resolution.name : 'N/A';
    }

    public lookupPanelTypeName(pttype: number): string {
        const panel_type = this.panelTypes().find(c => c.id === pttype);
        return panel_type ? panel_type.name : 'N/A';
    }



    // public lookupSIServiceName(internetId: number): string {
    //     const internet = this.internetServices().find(c => c.id === internetId);
    //     return internet ? internet.name : 'N/A';
    // }


    loadInitialData(): void {
        this.isLoading.set(true);
        this.message.set(null);

        const products$ = this.http.get<Product[]>(this.productUrl);
        const specifications$ = this.http.get<ProductSpecification[]>(this.specUrl);
        const brands$ = this.http.get<Brand[]>(`${this.setupUrl}/brands/`);
        const categories$ = this.http.get<ProductCategory[]>(`${this.setupUrl}/categories/`);
        const sizes$ = this.http.get<ScreenSize[]>(`${this.setupUrl}/screen-sizes/`);
        const resolutions$ = this.http.get<SupportedResolution[]>(`${this.setupUrl}/resolutions/`);
        const panels$ = this.http.get<PanelType[]>(`${this.setupUrl}/panel-types/`);
        const internetServices$ = this.http.get<SupportedInternetService[]>(`${this.setupUrl}/internet-services/`);

        forkJoin({
            products: products$,
            specifications: specifications$,
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
                this.specifications.set(results.specifications);
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
                this.loadInitialData();
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
        this.productForm.patchValue({ is_active: 'true', category: null });
        this.currentProduct.set(null);
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
                this.currentProduct.set(data);
                this.productForm.patchValue({
                    name: data.name,
                    description: data.description,
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

      const payload = {
          name: rawValue.name,
          description: rawValue.description,
          category: Number(rawValue.category),
          is_active: rawValue.is_active === 'true',
      };

      const url = (this.modalMode === 'edit' && this.currentProductId)
          ? `${this.productUrl}${this.currentProductId}/`
          : this.productUrl;

      const httpMethod = (this.modalMode === 'edit' && this.currentProductId) ?
          this.http.put<Product>(url, payload) :
          this.http.post<Product>(url, payload);

      httpMethod.pipe(
          finalize(() => this.isLoading.set(false))
      ).subscribe({
          next: (response: Product) => {
              this.currentProduct.set(response);
              this.modalService.dismissAll('saved');

              if (this.modalMode === 'create' && response.id) {
                  this.message.set(`Product "${response.name}" created successfully. Now, add specifications (SKUs).`);
                  this.handleCreateSpecModal(response);
              }
              else if (this.modalMode === 'edit') {
                  this.message.set(`Product "${response.name}" updated successfully.`);
                  this.loadInitialData();
              }

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
    // --- STAGE 2: SPECIFICATION CRUD (Using dedicated /specs/ endpoint) -----
    // ----------------------------------------------------------------------

    /** Opens modal for creating a new specification, setting the parent product context immediately. */
    handleCreateSpecModal(product: Product): void {
        this.currentProduct.set(product);
        this.currentSpecProductParentId = product.id ?? null;

        this.modalMode = 'create-spec';
        this.currentSpecId = null;

        this.specForm.reset();
        this.specForm.patchValue({
            smart_features: 'false',
            id: null,
            brand: null,
            screen_size: null,
            resolution: null,
            panel_type: null,
            electrical_specs_voltage: null,
            electrical_specs_wattage: null,
            electrical_specs_power_supply_type: null,
        });
        this.selectedInternetServices.set([]);

        if (this.specModal) this.openModal(this.specModal, 'lg');
    }

    /** Opens modal for editing an existing specification. */
    handleEditSpecModal(specId: number, productId: number): void {
        this.modalMode = 'edit-spec';
        this.currentSpecId = specId;
        this.currentSpecProductParentId = productId;
        this.specForm.reset();
        this.message.set(null);
        this.isLoading.set(true);

        const product = this.products().find(p => p.id === productId);
        if (product) {
            this.currentProduct.set(product);
        }

        // Fetch the SPECIFICATION data directly from the dedicated /specs/{id}/ endpoint
        const url = `${this.specUrl}${specId}/`;
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

    /** Helper to patch the spec form and set M2M services, including nested electrical_specs. */
    private patchSpecForm(specData: ProductSpecification): void {
        this.specForm.patchValue({
            id: specData.id || null,
            model: specData.model,
            screen_size: specData.screen_size,
            resolution: specData.resolution,
            panel_type: specData.panel_type,
            original_price: specData.original_price,
            sale_price: specData.sale_price,
            color: specData.color,
            smart_features: String(specData.smart_features),

            // Patching nested Electrical Specs
            electrical_specs_voltage: specData.electrical_specs?.voltage || null,
            electrical_specs_wattage: specData.electrical_specs?.wattage || null,
            electrical_specs_power_supply_type: specData.electrical_specs?.power_supply_type || null,
        });
        this.selectedInternetServices.set(specData.supported_internet_services || []);
    }


    /** Submits the single specification form (Create/Update) via POST/PUT to the /specs/ endpoint. */
    onAddProductSpec(): void {
      this.message.set(null);
      this.isLoading.set(true);

      const parentId = this.currentSpecProductParentId;

      if (this.specForm.invalid || !parentId) {
          this.specForm.markAllAsTouched();
          this.isLoading.set(false);
          if (!parentId) {
              this.message.set("Missing base product context. Cannot save specification.");
          }
          return;
      }

      const rawValue = this.specForm.getRawValue();

      // 1. Conditionally build the nested ElectricalSpecification payload
      let electricalSpecsPayload: ElectricalSpecification | null = null;
      if (rawValue.electrical_specs_voltage || rawValue.electrical_specs_wattage) {
          electricalSpecsPayload = {
              voltage: rawValue.electrical_specs_voltage ?? '',
              wattage: rawValue.electrical_specs_wattage ?? 0,
              power_supply_type: rawValue.electrical_specs_power_supply_type ?? '',
          };
      }

      // 2. Prepare the main ProductSpecification payload
      const payload: any = {
          id: rawValue.id ?? undefined,
          product: parentId,
          model: rawValue.model!,
          color: rawValue.color,
          brand: Number(rawValue.brand),
          smart_features: rawValue.smart_features === 'true',
          screen_size: Number(rawValue.screen_size),
          resolution: Number(rawValue.resolution),
          panel_type: Number(rawValue.panel_type),
          original_price: Number(rawValue.original_price),
          sale_price: Number(rawValue.sale_price),
          supported_internet_services: this.selectedInternetServices(),
      };

      // 3. Attach the nested payload if it exists (aligns with nested serializer)
      if (electricalSpecsPayload) {
          payload.electrical_specs = electricalSpecsPayload;
      }

      // 4. Determine URL and Method
      const isEdit = this.modalMode === 'edit-spec' && rawValue.id;
      const url = isEdit ? `${this.specUrl}${rawValue.id}/` : this.specUrl;

      const httpMethod = isEdit ?
          this.http.put<ProductSpecification>(url, payload) :
          this.http.post<ProductSpecification>(url, payload);

      // 5. Execute Request
      httpMethod.pipe(
          finalize(() => this.isLoading.set(false))
      ).subscribe({
          next: (response) => {
              this.modalService.dismissAll('saved');
              this.loadInitialData();
              // this.message.set(`Specification (SKU: ${response.sku}) saved successfully.`);
              this.message.set(`Specification saved successfully.`);

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
        if (!this.currentSpecId) return;

        this.isLoading.set(true);
        const url = `${this.specUrl}${this.currentSpecId}/`;

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
        this.loadInitialData();
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
