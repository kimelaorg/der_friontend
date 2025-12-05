import { Component, OnInit, OnDestroy, signal, WritableSignal, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Subscription, startWith, switchMap, of, filter } from 'rxjs'; // Added 'filter'
import { Logic } from './logics';
import { faStar, faPlus, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { ActionButton } from '../../../Layout/Components/page-title/page-title.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Entity, ExpensePayload, RegionEntity, DistrictEntity, WardEntity, StreetEntity, PostcodeEntity } from './data';


@Component({
  selector: 'app-expenses',
  standalone: false,
  templateUrl: './expenses.html',
  styleUrl: './expenses.scss',
})
export class Expenses implements OnInit, OnDestroy {

  heading = 'Manage Expenses';
  subheading = 'Daily Expenses';
  icon = 'pe-7s-wallet icon-gradient bg-malibu-beach';

  expenseForm!: FormGroup;
  isLoading: boolean = false;
  isSubmitted: boolean = false;

  expenses: WritableSignal<ExpensePayload[]> = signal([]);
  message: WritableSignal<string | null> = signal(null);

  // --- Dynamic Data Containers ---
  paymentMethods: string[] = ['Cash', 'Credit Card', 'Mobile Money', 'Bank Transfer'];
  existingCategories: Entity[] = []; // Fetched from DB
  existingPayees: Entity[] = [];      // Fetched from DB

  regions: RegionEntity[] = [];
  districts: DistrictEntity[] = []; // Districts will be loaded dynamically
  wards: WardEntity[] = [];
  streets: StreetEntity[] = [];
  post_codes: PostcodeEntity[] = [];

  // Subscriptions management
  private subscriptions: Subscription = new Subscription();
  @ViewChild('expenseFormContent') expenseFormContent!: ElementRef;
  private activeModal!: NgbModalRef;

  constructor(
    private fb: FormBuilder,
    private expenseService: Logic,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchInitialData();
    this.setupCategoryChange();
    this.setupPayeeChange();
    this.setupRegionDistrictChains();
    this.loadAllExpenses();
  }

  openExpenseModal(): void {
    this.isSubmitted = false;
    this.message.set(null);
    this.expenseForm.reset({
        payment_method: '',
        category_choice: 'existing',
        payee_choice: 'none',
        new_payee: { hasAddress: false }
    });
    // Clear all validators and mark controls as pristine
    this.expenseForm.markAsPristine();
    this.expenseForm.markAsUntouched();

    // Open the modal using the template reference
    this.activeModal = this.modalService.open(this.expenseFormContent, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false
    });
  }

  /**
   * Closes the active modal.
   */
  closeExpenseModal(): void {
    if (this.activeModal) {
      this.activeModal.close();
    }
  }

  // --- 1. Initialization and Data Fetching ---

  private initializeForm(): void {
    this.expenseForm = this.fb.group({
      // Core Fields
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
      payment_method: ['', Validators.required],

      // Category
      category_choice: ['existing', Validators.required],
      category_id: [null],
      new_category: this.fb.group({
        name: [''],
      }),

      // Payee
      payee_choice: ['none', Validators.required],
      payee_id: [null],
      new_payee: this.fb.group({
        payee_name: [''],
        phone_number: [''],
        hasAddress: [false],
        address: this.fb.group({
          region_id: [null],
          district_id: [null],
          ward_id: [null],
          street_id: [null],
          post_code_id: [null],
        }),
      }),
    }, { validators: [
      this.categoryAssociationValidator(),
      this.addressRegionValidator()
    ]});

    this.setupPayeeValidation();
  }

  loadAllExpenses(): void {
    this.expenseService.getAllExpenses().subscribe({
      next: (data) => this.expenses.set(data),
      error: (err) => console.error('Failed to load receptions', err)
    });
  }

  private fetchInitialData(): void {
    // 1. Categories
    this.subscriptions.add(
      this.expenseService.fetchCategories().subscribe(data => this.existingCategories = data)
    );
    // 4. Existing Payees
    this.subscriptions.add(
      this.expenseService.fetchPayees().subscribe(data => this.existingPayees = data)
    );
    // 6. Regions (Only fetch regions initially)
    this.subscriptions.add(
        this.expenseService.fetchRegions().subscribe(data => this.regions = data as RegionEntity[])
    );
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  // --- 2. Dynamic Field Logic Subscriptions (setupCategoryChange and setupPayeeChange unchanged) ---

  private setupCategoryChange(): void {
    const choiceControl = this.expenseForm.get('category_choice')!;
    const idControl = this.expenseForm.get('category_id')!;
    // FIX: Changed 'category_name' to 'name' based on FormBuilder structure
    const nameControl = this.newCategory.get('name')!;

    this.subscriptions.add(
      choiceControl.valueChanges.subscribe(choice => {
        idControl.setValue(null);
        idControl.clearValidators();
        nameControl.setValue('');
        nameControl.clearValidators();

        if (choice === 'existing') {
          idControl.setValidators(Validators.required);
        } else if (choice === 'new') {
          nameControl.setValidators(Validators.required);
        }
        idControl.updateValueAndValidity();
        nameControl.updateValueAndValidity();
        this.expenseForm.updateValueAndValidity();
      })
    );
  }

  private setupPayeeChange(): void {
    const choiceControl = this.expenseForm.get('payee_choice')!;
    const idControl = this.expenseForm.get('payee_id')!;
    const nameControl = this.newPayee.get('payee_name')!;
    const hasAddressControl = this.newPayee.get('hasAddress')!;

    this.subscriptions.add(
      choiceControl.valueChanges.subscribe(choice => {
        idControl.setValue(null);
        idControl.clearValidators();
        nameControl.setValue('');
        nameControl.clearValidators();
        this.newPayee.get('phone_number')?.setValue(''); // Clear phone number on choice change
        hasAddressControl.setValue(false);

        if (choice === 'existing') {
          idControl.setValidators(Validators.required);
        } else if (choice === 'new') {
          nameControl.setValidators(Validators.required);
        }
        idControl.updateValueAndValidity();
        nameControl.updateValueAndValidity();
        this.expenseForm.updateValueAndValidity();
      })
    );

    this.subscriptions.add(
      hasAddressControl.valueChanges.subscribe(() => {
        this.expenseForm.updateValueAndValidity();
        // Reset address fields when address toggle is switched off
        if (!hasAddressControl.value) {
            this.newPayeeAddress.reset({
                region_id: null,
                district_id: null,
                ward_id: null,
                street_id: null,
                post_code_id: null
            });
        }
      })
    );
  }

  private setupPayeeValidation(): void {
      this.subscriptions.add(
          this.expenseForm.get('payee_choice')!.valueChanges
              .subscribe(choice => {
                  const payeeIdControl = this.expenseForm.get('payee_id')!;
                  // FIX: Changed control name from 'name' to 'payee_name'
                  const newPayeeNameControl = this.newPayee.get('payee_name')!;

                  payeeIdControl.clearValidators();
                  newPayeeNameControl.clearValidators();

                  if (choice === 'existing') {
                      payeeIdControl.setValidators(Validators.required);
                  } else if (choice === 'new') {
                      newPayeeNameControl.setValidators(Validators.required);
                  }

                  payeeIdControl.updateValueAndValidity();
                  newPayeeNameControl.updateValueAndValidity();
                  this.expenseForm.updateValueAndValidity();
              })
      );
  }

  // 7. Chained Region -> District -> Ward population (FIXED IMPLEMENTATION)
  private setupRegionDistrictChains(): void {
    // Get form controls
    const regionControl = this.newPayeeAddress.get('region_id')!;
    const districtControl = this.newPayeeAddress.get('district_id')!;
    const wardControl = this.newPayeeAddress.get('ward_id')!;
    const streetControl = this.newPayeeAddress.get('street_id')!;
    const postCodeControl = this.newPayeeAddress.get('post_code_id')!;

    // --- A. Region -> District Chain (Fetches Districts from API) ---
    this.subscriptions.add(
        regionControl.valueChanges.pipe(
            startWith(regionControl.value),
            filter((selectedRegionId): selectedRegionId is string => !!selectedRegionId),
            switchMap((selectedRegionId: string) => {
                // Reset all downstream controls and data
                districtControl.setValue(null, { emitEvent: false });
                wardControl.setValue(null, { emitEvent: false });
                streetControl.setValue(null, { emitEvent: false });
                postCodeControl.setValue(null, { emitEvent: false });

                this.districts = [];
                this.wards = [];
                this.streets = [];
                this.post_codes = [];

                // Call service (Assuming fetchDistrictsByRegion is available)
                return this.expenseService.fetchDistrictsByRegion(selectedRegionId);
            })
        ).subscribe(districts => {
            this.districts = districts;
            districtControl.updateValueAndValidity();
        },
            error => console.error('Error fetching districts:', error))
    );

    // --- B. District -> Ward Chain (Fetches Wards from API) ---
    this.subscriptions.add(
        districtControl.valueChanges.pipe(
            startWith(districtControl.value),
            filter((selectedDistrictId): selectedDistrictId is string => !!selectedDistrictId),
            switchMap((selectedDistrictId: string) => {
                // Reset all downstream controls and data
                wardControl.setValue(null, { emitEvent: false });
                streetControl.setValue(null, { emitEvent: false });
                postCodeControl.setValue(null, { emitEvent: false });

                this.wards = [];
                this.streets = [];
                this.post_codes = [];

                const selectedRegionId: string = regionControl.value;

                if (!selectedRegionId) {
                    return of([]);
                }

                // Call service: fetchWardsByDistrict (Requires Region + District)
                return this.expenseService.fetchWardsByDistrict(selectedRegionId, selectedDistrictId);
            })
        ).subscribe(wards => {
            this.wards = wards;
            wardControl.updateValueAndValidity();
        },
            error => console.error('Error fetching wards:', error))
    );

    // --- C. Ward -> Street Chain (Fetches Streets from API) ---
    this.subscriptions.add(
        wardControl.valueChanges.pipe(
            startWith(wardControl.value),
            filter((selectedWardId): selectedWardId is string => !!selectedWardId),
            switchMap((selectedWardId: string) => {
                // Reset all downstream controls and data
                streetControl.setValue(null, { emitEvent: false });
                postCodeControl.setValue(null, { emitEvent: false });

                this.streets = [];
                this.post_codes = [];

                const selectedRegionId: string = regionControl.value;
                const selectedDistrictId: string = districtControl.value;

                if (!selectedRegionId || !selectedDistrictId) {
                    return of([]);
                }

                // Call service: fetchStreetsByWard (Requires Region + District + Ward)
                return this.expenseService.fetchStreetsByWard(
                    selectedRegionId,
                    selectedDistrictId,
                    selectedWardId
                );
            })
        ).subscribe(streets => {
            this.streets = streets;
            streetControl.updateValueAndValidity();
        },
            error => console.error('Error fetching streets:', error))
    );

    // --- D. Street -> Post Code Chain (Fetches Post Codes from API) ---
    this.subscriptions.add(
        streetControl.valueChanges.pipe(
            startWith(streetControl.value),
            filter((selectedStreetId): selectedStreetId is string => !!selectedStreetId),
            switchMap((selectedStreetId: string) => {
                // Reset downstream controls and data
                postCodeControl.setValue(null, { emitEvent: false });
                this.post_codes = [];

                const selectedRegionId: string = regionControl.value;
                const selectedDistrictId: string = districtControl.value;
                const selectedWardId: string = wardControl.value;

                if (!selectedRegionId || !selectedDistrictId || !selectedWardId) {
                    return of([]);
                }

                // Call service: fetchPostcodesByStreet (Requires Region + District + Ward + Street)
                return this.expenseService.fetchPostcodesByStreet(
                    selectedRegionId,
                    selectedDistrictId,
                    selectedWardId,
                    selectedStreetId
                );
            })
        ).subscribe(post_codes => {
            this.post_codes = post_codes;
            postCodeControl.updateValueAndValidity();
        },
            error => console.error('Error fetching post codes:', error))
    );
  }

  // --- 3. Custom Validators (unchanged) ---

  categoryAssociationValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const choice = control.get('category_choice')?.value;
      const id = control.get('category_id')?.value;
      const newName = control.get('new_category.name')?.value;

      if (choice === 'existing' && !id) { return { categoryMissing: true }; }
      if (choice === 'new' && !newName) { return { categoryMissing: true }; }
      return null;
    };
  }

  addressRegionValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const isNewPayee = control.get('payee_choice')?.value === 'new';
      const hasAddress = control.get('new_payee.hasAddress')?.value;
      const regionIdControl = control.get('new_payee.address.region_id');

      if (isNewPayee && hasAddress) {
        if (!regionIdControl?.value) {
            regionIdControl?.setErrors({ required: true });
            return { addressRegionRequired: true };
        } else {
            if (regionIdControl?.hasError('required')) {
                regionIdControl.setErrors(null);
            }
        }
      } else {
        if (regionIdControl?.hasError('required')) {
            regionIdControl.setErrors(null);
        }
      }
      return null;
    };
  }

  // --- 4. Getters and Cleanup (unchanged) ---

  get newCategory(): FormGroup { return this.expenseForm.get('new_category') as FormGroup; }
  get newPayee(): FormGroup { return this.expenseForm.get('new_payee') as FormGroup; }
  get newPayeeAddress(): FormGroup { return this.newPayee.get('address') as FormGroup; }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // --- 5. API Error Mapping ---

  /**
   * Recursively maps nested API errors to corresponding Angular FormControls.
   * @param form The FormGroup or FormArray to map errors to.
   * @param errors The error object received from the API.
   */
  private mapApiErrorsToForm(form: FormGroup, errors: any): void {
    // Iterate over the keys in the API error object
    Object.keys(errors).forEach(key => {
        // Try to find a control in the current FormGroup that matches the API key
        const control = form.get(key);

        if (control) {
            const errorValue = errors[key];

            if (Array.isArray(errorValue)) {
                // Case 1: The error is an array of strings (e.g., "phone_number": ["The phone number..."])
                // We assume the first error message is sufficient for display
                control.setErrors({ serverError: errorValue[0] });
                control.markAsDirty(); // Mark dirty/touched to show the error immediately

            } else if (typeof errorValue === 'object' && control instanceof FormGroup) {
                // Case 2: The error is a nested object, and the control is a FormGroup (e.g., "new_payee": { ... })
                this.mapApiErrorsToForm(control, errorValue);
            }

        } else if (form.parent) {
            // Special Case for nested field names like 'new_payee.name' which
            // map to 'payee_name' in the form (a difference in backend vs frontend naming)
            // You must handle these specific mappings manually if they differ.

            // Example for Payee Name:
            if (key === 'name' && form.get('payee_name')) {
                const payeeNameControl = form.get('payee_name')!;
                if (Array.isArray(errors[key])) {
                    payeeNameControl.setErrors({ serverError: errors[key][0] });
                    payeeNameControl.markAsDirty();
                }
            }
        }
    });
  }


  // --- 6. Submission Handler (Updated to use mapApiErrorsToForm) ---
  onSubmit(): void {
    this.isSubmitted = true;

    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const rawValue = this.expenseForm.getRawValue();

    const payload: ExpensePayload = {
      amount: rawValue.amount,
      description: rawValue.description,
      payment_method: rawValue.payment_method,
    } as ExpensePayload;

    // Category Payload
    if (rawValue.category_choice === 'existing') {
      payload.category_id = rawValue.category_id;
    } else if (rawValue.category_choice === 'new') {
      payload.new_category = rawValue.new_category;
    }

    // Payee Payload
    if (rawValue.payee_choice === 'existing') {
      payload.payee_id = rawValue.payee_id;
    } else if (rawValue.payee_choice === 'new') {
      const newPayeePayload: any = {
        name: rawValue.new_payee.payee_name, // Backend expects 'name', Frontend uses 'payee_name'
        phone_number: rawValue.new_payee.phone_number,
      };

      if (rawValue.new_payee.hasAddress && rawValue.new_payee.address.region_id) {
        newPayeePayload.address = {
            region: rawValue.new_payee.address.region_id,
            district: rawValue.new_payee.address.district_id,
            ward: rawValue.new_payee.address.ward_id,
            street: rawValue.new_payee.address.street_id,
            post_code: rawValue.new_payee.address.post_code_id,
        };
      }
      payload.new_payee = newPayeePayload;
    }

    this.expenseService.createExpense(payload)
      .subscribe({
        next: (response) => {
          console.log('Expense created successfully:', response);
          console.log('Expense recorded successfully!');

          this.expenseForm.reset({
              payment_method: '',
              category_choice: 'existing',
              payee_choice: 'none',
              new_payee: { hasAddress: false }
          });
          this.isLoading = false;
          this.isSubmitted = false;
          this.fetchInitialData();
        },
        error: err => {
          this.isLoading = false;
          const errors = err?.error;

          if (errors && typeof errors === 'object') {
            // 👇 USE THE NEW RECURSIVE MAPPING FUNCTION
            this.mapApiErrorsToForm(this.expenseForm, errors);
            this.expenseForm.markAllAsTouched(); // Ensure controls are touched to show errors

          } else {
            // General error message (e.g., network failure)
            this.message.set('An unexpected error occurred. Please try again.');
            console.error('Unexpected registration error:', err);
          }
        }
      });
  }

  handleCreateModal = () => {
        this.openExpenseModal();
      }

  actionButtons: ActionButton[] = [
    {
      text: 'New Expense',
      icon: faPlus,
      class: 'btn-success',
      onClick: this.handleCreateModal
    }
  ];

}
