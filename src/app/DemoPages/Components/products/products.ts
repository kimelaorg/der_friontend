import { Component, signal, WritableSignal, inject, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { FormBuilder, FormGroup, Validators, FormControl, NonNullableFormBuilder, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, forkJoin, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { faStar, faPlus, faEdit, faTrash, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ActionButton } from '../../../Layout/Components/page-title/page-title.component';
import {
    ProductImage, ProductVideo, ConnectivityItem, ElectricalSpecs, ConnectivityPayload,
    BaseSetupItem, Brand, ProductCategory, ScreenSize, SupportedResolution, PanelType, Connectivity,
    SupportedInternetService, ElectricalSpecification, DigitalProduct, ProductSpecification, Product, Slide
} from './manager';
import { Productspecificationmanager } from './productspecificationmanager';


// --- Form Definitions (Updated) ---

export interface ProductBaseForm {
    name: FormControl<string>;
    description: FormControl<string>;
    // brand: FormControl<number | null>;
    category: FormControl<number | null>;
    is_active: FormControl<string>;
}

export interface ElectricalSpecForm {
    voltage: FormControl<string | null>;
    wattage: FormControl<number | null>;
    power_supply_type: FormControl<string | null>;
}

// NEW INTERFACE for the connectivity FormArray elements
export interface ConnectivityItemForm extends FormGroup<{
    connectivity: FormControl<number>; // The ID of the connectivity type
    connectivity_count: FormControl<number>; // The count/number of ports
}> {}

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

    // Nested ElectricalSpecification fields
    electrical_specs: FormGroup<ElectricalSpecForm>;

    // NEW: FormArray for multiple connectivity entries, each with a count
    product_connectivity_array: FormArray<ConnectivityItemForm>;
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
    @Input() productId!: number;
    private specService = inject(Productspecificationmanager);
    private modalService = inject(NgbModal);
    private fb = inject(FormBuilder); // Used for FormArray helpers

    // Data containers
    images$: BehaviorSubject<ProductImage[]> = new BehaviorSubject<ProductImage[]>([]);
    videos$: BehaviorSubject<ProductVideo[]> = new BehaviorSubject<ProductVideo[]>([]);
    connectivity$: BehaviorSubject<ConnectivityItem[]> = new BehaviorSubject<ConnectivityItem[]>([]);
    electricalSpecs$: BehaviorSubject<ElectricalSpecs | null> = new BehaviorSubject<ElectricalSpecs | null>(null);


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

    // NEW: Available connectivities setup data (assuming the data structure is BaseSetupItem[])
    availableConnectivities: WritableSignal<BaseSetupItem[]> = signal([]);


    products: WritableSignal<Product[]> = signal([]);
    specifications: WritableSignal<ProductSpecification[]> = signal([]);
    brands: WritableSignal<Brand[]> = signal([]);
    categories: WritableSignal<ProductCategory[]> = signal([]);
    screenSizes: WritableSignal<ScreenSize[]> = signal([]);
    resolutions: WritableSignal<SupportedResolution[]> = signal([]);
    panelTypes: WritableSignal<PanelType[]> = signal([]);
    selectedConnectivities = signal<number[]>([])

    // Product Base Form (Unchanged)
    productForm: FormGroup<ProductBaseForm> = this.formBuilder.group({
        name: ['', [Validators.required]],
        description: ['', [Validators.required]],
        category: [null as number | null, [Validators.required]],
        is_active: ['true', [Validators.required]],
    });

    // Product Spec Form (Updated for nested fields AND FormArray)
    specForm: FormGroup<any> = this.formBuilder.group({ // Use 'any' here for flexibility with FormArray
        id: [null as number | null],
        model: ['', [Validators.required, Validators.maxLength(255)]],
        screen_size: [null as number | null, [Validators.required]],
        resolution: [null as number | null, [Validators.required]],
        panel_type: [null as number | null, [Validators.required]],
        // NOTE: Keeping as Number in form but converting to String in payload if required by API
        original_price: [null as number | null, [Validators.required, Validators.min(0)]],
        sale_price: [null as number | null, [Validators.required, Validators.min(0)]],
        color: [null as string | null],
        brand: [null as number | null, [Validators.required]],
        smart_features: ['false', [Validators.required]],

        // Electrical Specs (Optional fields)
        electrical_specs: this.formBuilder.group({
            voltage: [null as string | null],
            // Note: You had a typo here before (electrical_speics_wattage). Make sure the name is correct now.
            wattage: [null as number | null],
            power_supply_type: [null as string | null],
        }),

        // NEW: FormArray to hold connectivity IDs and their counts
        product_connectivity_array: this.fb.array<ConnectivityItemForm>([]),
    });


    // --- Connectivity FormArray Helpers ---
    getConnectivityDetail(connectivityId: number): Connectivity | undefined {
        // We use the parentheses to access the signal value: availableConnectivities()
        return this.availableConnectivities().find(c => c.id === connectivityId);
    }

    get productConnectivityArray(): FormArray<ConnectivityItemForm> {
        return this.specForm.get('product_connectivity_array') as FormArray<ConnectivityItemForm>;
    }

    createConnectivityGroup(connectivityId: number, count: number = 1): ConnectivityItemForm {
        return this.fb.group({
            connectivity: this.fb.control(connectivityId, { nonNullable: true }),
            connectivity_count: this.fb.control(count, [Validators.required, Validators.min(1)]),
        }) as ConnectivityItemForm;
    }

    // Helper to check if a connectivity ID is already in the FormArray
    isConnectivitySelected(id: number): boolean {
        return this.productConnectivityArray.controls.some(
            control => control.get('connectivity')?.value === id
        );
    }

    // Gets the count for an already selected connectivity ID
    getConnectivityCount(id: number): number | null {
        const control = this.productConnectivityArray.controls.find(
            c => c.value.connectivity === id
        );
        return control ? control.value.connectivity_count : null;
    }

    // Toggles the selection and manages the FormArray
    toggleConnectivitySelection(id: number): void {
        const formArray = this.productConnectivityArray;
        const index = formArray.controls.findIndex(
            control => control.value.connectivity === id
        );

        if (index > -1) {
            // Remove: Connectivity exists, so remove the group
            formArray.removeAt(index);
        } else {
            // Add: Connectivity doesn't exist, so add a new group
            formArray.push(this.createConnectivityGroup(id));
        }
    }


    // --- Other Forms (Removed connectivityForm, kept others) ---
    mediaForm = this.fb.group({
      file: this.fb.control<File | null>(null, Validators.required),
      product: [null]
    });
    // connectivityForm removed as it's not used by onAddProductSpec anymore.
    electricalForm = this.fb.group({
        voltage: ['', Validators.required],
        max_wattage: [''],
        frequency: ['50/60 Hz', Validators.required],
        id: [null]
    });

    currentFile: File | null = null; // Holds the file selected for upload
    isSubmitting: boolean = false;
    currentTab: string = 'images';

    ngOnInit(): void {
        this.loadInitialData();
        // if (!this.productId) {
        //     console.error('Product ID is required for ProductMediaSpecsManagerComponent.');
        //     // return; // Commented out to allow the component to load initial setup data
        // }
        // Assuming loadData is only called if productId exists and the component is used as a child
        if(this.productId) {
            this.loadData(this.currentTab);
        }
    }

    // --- Data Loading and Tab Navigation ---
    loadData(tab: string): void {
        switch (tab) {
            case 'images':
                this.specService.getImages(this.productId).subscribe(data => this.images$.next(data));
                break;
            case 'videos':
                this.specService.getVideos(this.productId).subscribe(data => this.videos$.next(data));
                break;
            case 'connectivity':
                this.specService.getConnectivity(this.productId).subscribe(data => this.connectivity$.next(data));
                break;
            case 'electrical':
                this.specService.getElectricalSpecs(this.productId).subscribe(data => {
                    this.electricalSpecs$.next(data);
                    if (data) {
                        this.electricalForm.patchValue(data);
                    }
                });
                break;
        }
    }

    onNavChange(change: any): void {
        this.currentTab = change.nextId;
        this.loadData(this.currentTab);
    }

    // --- File Handling ---
    onFileSelected(event: any): void {
        this.currentFile = event.target.files.length > 0 ? event.target.files[0] : null;
        this.mediaForm.get('file')?.setValue(this.currentFile);
    }

    // --- Modal Management and CRUD ---
    openFileModal(content: any, type: string, item?: any): void {
        if (type === 'image' || type === 'video') {
            this.mediaForm.reset({ product: this.productId, file: null });
            this.currentFile = null;
        } else if (type === 'connectivity') {
            // DEPRECATED LOGIC: Old connectivity logic using single form is no longer used by onAddProductSpec
            console.warn('Connectivity Modal logic (openFileModal) is based on the deprecated single-connectivity form and may not be fully functional.');
        }
        this.modalService.open(content, { centered: true, size: 'md' });
    }

    // 1. Images/Videos CRUD (Combined logic)
    submitMedia(type: 'image' | 'video'): void {
        if (this.mediaForm.invalid || !this.currentFile) return;

        this.isSubmitting = true;
        const productId = this.productId;
        const formValue = this.mediaForm.value as any;
        let apiCall: Observable<any>;

        if (type === 'image') {
            apiCall = this.specService.createImage(productId, formValue, this.currentFile);
        } else {
            apiCall = this.specService.createVideo(productId, formValue, this.currentFile);
        }

        apiCall.pipe(
            finalize(() => this.isSubmitting = false)
        ).subscribe({
            next: () => {
                this.loadData(type + 's'); // Reload the list
                this.modalService.dismissAll();
            },
            error: (err) => console.error(`Error creating ${type}:`, err)
        });
    }

    deleteMedia(id: number, type: 'image' | 'video'): void {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

        let apiCall: Observable<any>;
        if (type === 'image') {
            apiCall = this.specService.deleteImage(id);
        } else {
            apiCall = this.specService.deleteVideo(id);
        }

        apiCall.subscribe({
            next: () => this.loadData(type + 's'),
            error: (err) => console.error(`Error deleting ${type}:`, err)
        });
    }

    // 2. Connectivity CRUD (DEPRECATED LOGIC, kept for completeness of original code but not used by spec form)
    submitConnectivity(): void {
        // This method relies on the old connectivityForm which is not part of the current spec management model
        // If this method is called, it will fail due to form structure.
        console.error("submitConnectivity() is deprecated. Connectivity is now managed via specForm's FormArray.");
        return;
    }

    deleteConnectivity(id: number): void {
        if (!confirm('Are you sure you want to delete this connectivity item?')) return;

        this.specService.deleteConnectivity(id).subscribe({
            next: () => this.loadData('connectivity'),
            error: (err) => console.error('Error deleting connectivity:', err)
        });
    }

    // 3. Electrical Specs CRUD (OneToOne)
    submitElectricalSpecs(): void {
        if (this.electricalForm.invalid) return;
        this.isSubmitting = true;

        const formValue = this.electricalForm.value as ElectricalSpecs;
        formValue.product = this.productId;

        this.specService.createOrUpdateElectricalSpecs(this.productId, formValue).pipe(
            finalize(() => this.isSubmitting = false)
        ).subscribe({
            next: (data) => {
                this.electricalSpecs$.next(data);
                this.loadData('electrical');
            },
            error: (err) => console.error('Error saving electrical specs:', err)
        });
    }


    // --- Lookup Methods (Intact) ---
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


    // --- Data Loading ---
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
        const connectivities$ = this.http.get<BaseSetupItem[]>(`${this.setupUrl}/connectivity/`); // NEW setup data load

        forkJoin({
            products: products$,
            specifications: specifications$,
            brands: brands$,
            categories: categories$,
            screenSizes: sizes$,
            resolutions: resolutions$,
            panelTypes: panels$,
            internetServices: internetServices$,
            connectivities: connectivities$, // NEW: Add connectivity setup data
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
                this.availableConnectivities.set(results.connectivities); // NEW: Set connectivity setup data
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
    // --- STAGE 1: BASE PRODUCT CRUD (Intact) ------------------------------
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
    // --- STAGE 2: SPECIFICATION CRUD (Updated for FormArray) ----------------
    // ----------------------------------------------------------------------

    /** Opens modal for creating a new specification, setting the parent product context immediately. */
    handleCreateSpecModal(product: Product): void {
        this.currentProduct.set(product);
        this.currentSpecProductParentId = product.id ?? null;

        this.modalMode = 'create-spec';
        this.currentSpecId = null;

        this.specForm.reset();
        // Reset all form controls to their initial/null state
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
        this.productConnectivityArray.clear(); // IMPORTANT: Clear the FormArray

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
        this.productConnectivityArray.clear(); // Clear before loading new data

        const product = this.products().find(p => p.id === productId);
        if (product) {
            this.currentProduct.set(product);
        }

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

    /** Helper to patch the spec form, set M2M services, nested electrical_specs, and the NEW connectivity FormArray. */
    private patchSpecForm(specData: ProductSpecification): void {
        this.specForm.patchValue({
            id: specData.id || null,
            model: specData.model,
            screen_size: specData.screen_size,
            resolution: specData.resolution,
            panel_type: specData.panel_type,
            // NOTE: Assuming prices in specData are numbers or strings convertible to number
            original_price: Number(specData.original_price),
            sale_price: Number(specData.sale_price),
            color: specData.color,
            brand: specData.brand,
            smart_features: String(specData.smart_features),

            // Patching nested Electrical Specs
            electrical_specs_voltage: specData.electrical_specs?.voltage || null,
            electrical_specs_wattage: specData.electrical_specs?.wattage || null,
            electrical_specs_power_supply_type: specData.electrical_specs?.power_supply_type || null,
        });

        // M2M services
        this.selectedInternetServices.set(specData.supported_internet_services || []);

        // NEW: Populate the FormArray for connectivity
        this.productConnectivityArray.clear();
        if (specData.product_connectivity && Array.isArray(specData.product_connectivity)) {
            specData.product_connectivity.forEach(conn => {
                this.productConnectivityArray.push(
                    this.createConnectivityGroup(conn.connectivity, conn.connectivity_count)
                );
            });
        }
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

      // 1. Prepare ElectricalSpecification Payload (No change needed)
      const electricalSpecsGroup = rawValue.electrical_specs;
      let electricalSpecsPayload: ElectricalSpecification | null = null;

      if (electricalSpecsGroup && (electricalSpecsGroup.voltage || electricalSpecsGroup.wattage)) {
          electricalSpecsPayload = {
              voltage: electricalSpecsGroup.voltage ?? '',
              wattage: electricalSpecsGroup.wattage ?? 0,
              power_supply_type: electricalSpecsGroup.power_supply_type ?? '',
              id: electricalSpecsGroup.id ?? undefined
          };
      }

      // 2. Prepare Product Connectivity Payload (FormArray name: product_connectivity_array)
      // CRITICAL CHANGE: The type definition now uses 'id' instead of 'connectivity'
      let productConnectivityPayload: { connectivity: number; connectivity_count: number }[] = [];
      const connectivityArrayRaw = rawValue.product_connectivity_array;

      if (connectivityArrayRaw && connectivityArrayRaw.length > 0) {
          productConnectivityPayload = connectivityArrayRaw
              // Filter out controls that don't have a connectivity ID set
              .filter((item: any) => item && item.connectivity)
              .map((item: any) => {

                  // Use parseInt for robust integer conversion
                  const connectivityId = item.connectivity ? parseInt(item.connectivity, 10) : NaN;
                  const count = item.connectivity_count ? parseInt(item.connectivity_count, 10) : NaN;

                  const isValidId = !isNaN(connectivityId) && connectivityId > 0;
                  const isValidCount = !isNaN(count) && count > 0;

                  if (isValidId && isValidCount) {
                      return {
                          // CRITICAL CHANGE: RENAME the field to 'id' for the API
                          connectivity: connectivityId,
                          connectivity_count: count,
                      };
                  }
                  // Return null for invalid entries
                  return null;
              })
              // Filter out the null entries
              .filter((item): item is { connectivity: number; connectivity_count: number } => item !== null);
      }

      // 3. Prepare the main ProductSpecification payload (No change needed)
      const payload: any = {
          id: rawValue.id ?? undefined,
          product: parentId,
          model: rawValue.model!,
          color: rawValue.color,
          brand: Number(rawValue.brand),
          smart_features: rawValue.smart_features === 'true' || rawValue.smart_features === true,
          screen_size: Number(rawValue.screen_size),
          resolution: Number(rawValue.resolution),
          panel_type: Number(rawValue.panel_type),
          original_price: String(rawValue.original_price),
          sale_price: String(rawValue.sale_price),
          supported_internet_services: this.selectedInternetServices(),
      };

      // 4. Attach the nested payloads (No change needed)
      if (electricalSpecsPayload) {
          payload.electrical_specs = electricalSpecsPayload;
      }

      // 5. Attach Product Connectivity.
      // CRITICAL CHANGE: Remove the 'data' wrapper since the backend serializer is now 'many=True'.
      if (productConnectivityPayload.length > 0) {
          // Send the array directly
          payload.product_connectivity = productConnectivityPayload;
      }

      // 6. Determine URL and Method (No change needed)
      const isEdit = this.modalMode === 'edit-spec' && rawValue.id;
      const url = isEdit ? `${this.specUrl}${rawValue.id}/` : this.specUrl;

      const httpMethod = isEdit ?
          this.http.put<ProductSpecification>(url, payload) :
          this.http.post<ProductSpecification>(url, payload);

      // 7. Execute Request (No change needed)
      httpMethod.pipe(
          finalize(() => this.isLoading.set(false))
      ).subscribe({
          next: (response) => {
              this.modalService.dismissAll('saved');
              this.loadInitialData();
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
    // --- UTILITIES (Intact) -----------------------------------------------
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



    // SLide show in madia section
    slides = signal<Slide[]>([
      { title: 'The Future of Sound', subtitle: 'New Audio Series - Up to 40% Off.', cta: 'Shop Now', link: '/sale/audio', imgClass: 'slide-1' },
      { title: 'Big Screen, Bigger Deals', subtitle: '4K QLED TVs starting at $499.', cta: 'Explore TVs', link: '/shop/tvs', imgClass: 'slide-2' },
      { title: 'Smart Home Essentials', subtitle: 'Control your life with our automation kits.', cta: 'See Kits', link: '/shop/smarthome', imgClass: 'slide-3' },
    ]);
    currentSlide = signal(0);
    private slideInterval: any;


    startSlideshow(): void {
      this.slideInterval = setInterval(() => {
        this.nextSlide();
      }, 5000); // Change slide every 5 seconds
    }

    resetSlideshowTimer(): void {
      clearInterval(this.slideInterval);
      this.startSlideshow();
    }

    nextSlide(): void {
      this.currentSlide.update(current =>
        (current + 1) % this.slides().length
      );
      this.resetSlideshowTimer();
    }

    prevSlide(): void {
      this.currentSlide.update(current =>
        (current - 1 + this.slides().length) % this.slides().length
      );
      this.resetSlideshowTimer();
    }

    setCurrentSlide(index: number): void {
      this.currentSlide.set(index);
      this.resetSlideshowTimer();
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
