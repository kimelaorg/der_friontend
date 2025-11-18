import { Component, OnInit } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms'; // <-- Added AbstractControl
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Control, ProductPayload, LookupItem } from './control';

@Component({
  selector: 'app-mega',
  standalone: false,
  templateUrl: './mega.html',
  styleUrl: './mega.scss',
})
export class Mega implements OnInit{

  // Stepper state
  currentStep: number = 1;

  // Form Groups for the two stages
  productForm!: FormGroup;
  specsForm!: FormGroup;

  // --- Properties to Store Lookup Data (For dropdowns) ---
  categories: LookupItem[] = [];
  brands: LookupItem[] = [];
  screenSizes: LookupItem[] = [];
  resolutions: LookupItem[] = [];
  panelTypes: LookupItem[] = [];
  supportedInternetServices: LookupItem[] = [];
  connectivityTypes: LookupItem[] = [];

  isLoadingLookups: boolean = true; // Loading indicator

  productId: number | null = null;
  mode: 'create' | 'edit' = 'create';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: Control
  ) {}

  ngOnInit(): void {

    // 1. Initialize Forms
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      category: [null, Validators.required],
      is_active: [true]
    });

    this.specsForm = this.fb.group({
      // Single FK IDs
      brand_id: [null, Validators.required],
      screen_size_id: [null, Validators.required],
      resolution_id: [null, Validators.required],
      panel_type_id: [null, Validators.required],

      original_price: ['', [Validators.required, Validators.min(0)]],
      sale_price: ['', [Validators.required, Validators.min(0)]],
      model: ['', Validators.required],
      color: [''],
      smart_features: [false],

      // M2M Field: Expects an array of IDs
      supported_internet_services: [[]],

      // Nested Form Group
      electrical_specs: this.fb.group({
        voltage: [''],
        max_wattage: [''],
        frequency: ['']
      }),

      // Dynamic arrays
      images: this.fb.array([]),
      videos: this.fb.array([]),
      connectivity: this.fb.array([])
    });

    // 2. Load all setup data and check for edit mode
    this.loadLookups().subscribe({
        next: () => {
             this.checkRouteAndLoadData();
        },
        error: (err) => {
            console.error('Fatal error loading lookup data:', err);
        }
    });
  }

  /**
   * Fetches all required lookup lists in parallel. (Unchanged)
   */
  loadLookups(): Observable<any> {
      this.isLoadingLookups = true;
      return forkJoin([
          this.productService.getCategories(),
          this.productService.getBrands(),
          this.productService.getScreenSizes(),
          this.productService.getSupportedResolutions(),
          this.productService.getPanelTypes(),
          this.productService.getSupportedInternetServices(),
          this.productService.getConnectivityTypes()
      ]).pipe(
          (data) => {
              data.subscribe(([
                  categories, brands, screenSizes, resolutions, panelTypes,
                  internetServices, connectivityTypes
              ]) => {
                  this.categories = categories;
                  this.brands = brands;
                  this.screenSizes = screenSizes;
                  this.resolutions = resolutions;
                  this.panelTypes = panelTypes;
                  this.supportedInternetServices = internetServices;
                  this.connectivityTypes = connectivityTypes;
                  this.isLoadingLookups = false;
              });
              return data;
          }
      );
  }

  checkRouteAndLoadData(): void {
      this.route.paramMap.subscribe(params => {
          const id = params.get('id');
          if (id) {
            this.productId = +id;
            this.mode = 'edit';
            this.loadProductData(this.productId);
          }
      });
  }

  loadProductData(id: number): void {
    this.productService.getProduct(id).subscribe({
      next: (data) => {
        this.productForm.patchValue(data);

        const spec = data.specification;

        // 2. Populate Specs Form
        this.specsForm.patchValue({
            brand: spec.brand,
            screen_size: spec.screen_size,
            resolution: spec.resolution,
            panel_type: spec.panel_type,

            model: spec.model,
            original_price: spec.original_price,
            sale_price: spec.sale_price,

            supported_internet_services: spec.supported_internet_services || [],

            electrical_specs: spec.electrical_specs,
        });

        // 3. Dynamically Populate FormArrays
        this.images.clear();
        this.connectivity.clear();

        // Load Images
        spec.images.forEach((img: any) => {
          const newImgGroup = this.newImage();
          newImgGroup.patchValue(img);
          this.images.push(newImgGroup);
        });

        // Load Connectivity
        spec.connectivity.forEach((conn: any) => {
          const newConnGroup = this.newConnectivity();
          newConnGroup.patchValue(conn);
          this.connectivity.push(newConnGroup);
        });
      },
      error: (err) => console.error('Failed to load product for editing:', err)
    });
  }

  // --- FormArray Getters ---
  get images(): FormArray {
      return this.specsForm.get('images') as FormArray;
  }

  get connectivity(): FormArray {
      return this.specsForm.get('connectivity') as FormArray;
  }

  get videos(): FormArray {
      return this.specsForm.get('videos') as FormArray;
  }

    // 🔥 FIX: File Change Handler
    /**
     * Captures the actual File object from the input event and sets it as the control's value.
     */
    onFileSelected(event: Event, control: AbstractControl): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            // Set the File object itself as the control's value
            control.setValue(input.files[0]);
            control.markAsDirty();
            // Clear the original file input value to allow the same file to be selected again
            input.value = '';
        }
    }


    /**
     * Converts the nested form data into FormData, necessary for DRF file uploads.
     */
    createFormData(payload: ProductPayload): FormData {
      const formData = new FormData();

      // 1. Append basic product fields
      formData.append('name', payload.name);
      formData.append('description', payload.description);
      formData.append('category', payload.category.toString());
      formData.append('is_active', payload.is_active.toString());

      // 2. Handle Specification fields
      const spec = payload.specification;

      // Append simple specification fields (FKs, numbers, strings, boolean)
      for (const key in spec) {
          if (!['images', 'videos', 'connectivity', 'electrical_specs'].includes(key)) {
              const value = spec[key];
              if (value !== null && value !== undefined && value !== '') {
                  // Handle M2M field (supported_internet_services: [1, 5, 9])
                  if (Array.isArray(value)) {
                      (value as number[]).forEach(id => {
                          formData.append(`specification.${key}`, id.toString());
                      });
                  } else {
                      formData.append(`specification.${key}`, value.toString());
                  }
              }
          }
      }

    // 3. Handle Nested Electrical Specs
    const electricalSpecs = spec.electrical_specs;
      if (electricalSpecs) {
          formData.append('specification.electrical_specs.voltage', electricalSpecs.voltage || '');
          formData.append('specification.electrical_specs.max_wattage', electricalSpecs.max_wattage || '');
          formData.append('specification.electrical_specs.frequency', electricalSpecs.frequency || '');
      }

    // 4. Handle Dynamic Arrays (Files and Nested Data)

    // a) Images (Files)
    spec.images.forEach((imgItem: any, index: number) => {
        if (imgItem.image instanceof File) {
            formData.append(`specification.images.${index}.image`, imgItem.image, imgItem.image.name);
        }
    });

    // b) Videos (Files)
    spec.videos.forEach((videoItem: any, index: number) => {
        // Use 'image' as the control name per newImage() but append to DRF field 'video'
        if (videoItem.image instanceof File) {
            formData.append(`specification.videos.${index}.video`, videoItem.image, videoItem.image.name);
        }
    });

    // c) Connectivity (Nested Data)
    spec.connectivity.forEach((connItem: any, index: number) => {
        formData.append(`specification.connectivity.${index}.connectivity`, connItem.connectivity.toString());
        formData.append(`specification.connectivity.${index}.connectivity_count`, connItem.connectivity_count.toString());
    });

    return formData;
  }


  newImage(): FormGroup {
    return this.fb.group({ image: ['', Validators.required] });
  }

  addMedia(type: 'image' | 'video'): void {
    const array = (type === 'image') ? this.images : this.videos; // <-- Used getter
    array.push(this.newImage());
  }

  removeMedia(type: 'image' | 'video', index: number): void {
    const array = (type === 'image') ? this.images : this.videos; // <-- Used getter
    array.removeAt(index);
  }

  newConnectivity(): FormGroup {
    return this.fb.group({
      connectivity: [null, Validators.required],
      connectivity_count: [1, [Validators.required, Validators.min(1)]]
    });
  }

  addConnectivity(): void {
    this.connectivity.push(this.newConnectivity());
  }

  removeConnectivity(index: number): void {
    this.connectivity.removeAt(index);
  }

  // --- Stepper Navigation (Remains Unchanged) ---
  goToStep(step: number): void {
    if (step === 2 && this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.currentStep = step;
  }

  /**
   * Final submission handler, now using FormData.
   */
  submitProduct(): void {
    if (this.productForm.invalid || this.specsForm.invalid) {
      this.productForm.markAllAsTouched();
      this.specsForm.markAllAsTouched();
      return;
    }

    // 1. Create the temporary JSON payload from form controls
    const finalPayload: ProductPayload = {
      ...this.productForm.getRawValue(),
      specification: {
        ...this.specsForm.getRawValue()
      }
    };

    // 2. Convert to FormData for file upload
    const formData = this.createFormData(finalPayload);

    let apiCall: Observable<any>;
    if (this.mode === 'create') {
      apiCall = this.productService.createProduct(formData); // <-- Send FormData
    } else {
      apiCall = this.productService.updateProduct(this.productId!, formData); // <-- Send FormData
    }

    apiCall.subscribe({
      next: (response) => {
        console.log('Submission successful:', response);
        this.router.navigate(['/products', 'edit', response.id]);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Submission failed:', err);
        this.mapValidationErrors(err);
      }
    });
  }
// ... (The rest of mapValidationErrors methods remain unchanged) ...
  /**
   * Maps DRF validation errors (400 Bad Request) to the form controls.
   */
  mapValidationErrors(error: HttpErrorResponse): void {
    if (error.status !== 400 || !error.error) return;

    const errors = error.error;

    for (const field in errors) {
      if (errors.hasOwnProperty(field)) {
        const errorMessages = errors[field];
        const errorMessage = Array.isArray(errorMessages) ? errorMessages[0] : 'Invalid value.';

        if (field === 'specification') {
          // Handle nested specification errors
          this.mapNestedSpecificationErrors(errorMessages);
          continue;
        }

        // Map to top-level product form control (e.g., 'name', 'category')
        const control = this.productForm.get(field);
        if (control) {
          control.setErrors({ 'server': errorMessage });
        } else if (field === 'non_field_errors' || field === 'detail') {
          console.error('General Form Error:', errorMessage);
        }
      }
    }
  }

  /**
   * Handles errors that apply to the nested 'specification' group.
   */
  mapNestedSpecificationErrors(nestedErrors: any): void {
    if (typeof nestedErrors !== 'object' || Array.isArray(nestedErrors)) {
        console.error('Specification Group Error:', nestedErrors);
        return;
    }

    // Map to specification form controls
    for (const specField in nestedErrors) {
        if (nestedErrors.hasOwnProperty(specField)) {
            const errorMessages = nestedErrors[specField];
            const errorMessage = Array.isArray(errorMessages) ? errorMessages[0] : 'Invalid value.';

            const control = this.specsForm.get(specField);
            if (control) {
                control.setErrors({ 'server': errorMessage });
            } else if (specField === 'electrical_specs') {
                // Map errors to the nested electrical_specs Form Group
                this.mapNestedElectricalSpecsErrors(nestedErrors[specField]);
            } else {
                console.error(`Unmapped Specification Field (${specField}):`, errorMessage);
            }
        }
    }
  }

  /**
   * Handles errors that apply to the nested 'electrical_specs' group.
   */
  mapNestedElectricalSpecsErrors(electricalErrors: any): void {
      const group = this.specsForm.get('electrical_specs');
      if (!group) return;

      for (const field in electricalErrors) {
          if (electricalErrors.hasOwnProperty(field)) {
              const errorMessages = electricalErrors[field];
              const errorMessage = Array.isArray(errorMessages) ? errorMessages[0] : 'Invalid value.';
              const control = group.get(field);
              if (control) {
                  control.setErrors({ 'server': errorMessage });
              }
          }
      }
  }
}
