import { Component, OnInit, OnDestroy, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Subscription, startWith, switchMap, of, filter } from 'rxjs'; // Added 'filter'
import { Logic } from './logics';
import { Entity, ExpensePayload, RegionEntity, DistrictEntity, WardEntity } from './data';


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

  // --- Dynamic Data Containers ---
  paymentMethods: string[] = ['Cash', 'Credit Card', 'Mobile Money', 'Bank Transfer'];
  existingCategories: Entity[] = []; // Fetched from DB
  existingPayees: Entity[] = [];     // Fetched from DB

  regions: RegionEntity[] = [];
  districts: DistrictEntity[] = []; // Districts will be loaded dynamically
  wards: WardEntity[] = [];         // Wards will be loaded dynamically

  // Subscriptions management
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private expenseService: Logic
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchInitialData();
    this.setupCategoryChange();
    this.setupPayeeChange();
    this.setupRegionDistrictChains();
    this.loadAllExpenses();
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
        category_name: [''],
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
    const nameControl = this.newCategory.get('category_name')!;

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
                ward_id: null
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

      // --- A. Region -> District Chain (Fetches Districts from API) ---
      this.subscriptions.add(
          regionControl.valueChanges.pipe(
              startWith(regionControl.value),
              // CRITICAL FIX: Filter out null/undefined values (on reset/init) to prevent API call
              filter((selectedRegionId): selectedRegionId is string => !!selectedRegionId),
              switchMap((selectedRegionId: string) => { // ID is the Mtaa name (string)
                  // CRITICAL FIX: Use { emitEvent: false } to prevent this reset from triggering the District subscription
                  districtControl.setValue(null, { emitEvent: false });
                  wardControl.setValue(null, { emitEvent: false });
                  this.districts = [];
                  this.wards = [];
                 
                  // Call service (using the new single-endpoint logic from Logic.ts)
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
              // CRITICAL FIX: Filter out null/undefined values (on reset/init) to prevent API call
              filter((selectedDistrictId): selectedDistrictId is string => !!selectedDistrictId),
              switchMap((selectedDistrictId: string) => { // ID is the Mtaa name (string)
                  // CRITICAL FIX: Use { emitEvent: false } to prevent this reset from triggering unwanted events
                  wardControl.setValue(null, { emitEvent: false });
                  this.wards = [];

                  const selectedRegionId: string = regionControl.value; // Get parent Region ID/Name

                  if (!selectedRegionId) {
                      return of([]);
                  }
                 
                  // Call service (using the new single-endpoint logic from Logic.ts)
                  return this.expenseService.fetchWardsByDistrict(selectedRegionId, selectedDistrictId);
              })
          ).subscribe(wards => {
              this.wards = wards;
              wardControl.updateValueAndValidity();
          },
            error => console.error('Error fetching wards:', error))
      );
  }

  // --- 3. Custom Validators (unchanged) ---

  categoryAssociationValidator(): ValidatorFn {
    // ... (unchanged)
    return (control: AbstractControl): {[key: string]: any} | null => {
      const choice = control.get('category_choice')?.value;
      const id = control.get('category_id')?.value;
      const newName = control.get('new_category.category_name')?.value;

      if (choice === 'existing' && !id) { return { categoryMissing: true }; }
      if (choice === 'new' && !newName) { return { categoryMissing: true }; }
      return null;
    };
  }

  addressRegionValidator(): ValidatorFn {
    // ... (unchanged)
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

  // --- 5. Submission Handler (unchanged) ---
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
        payee_name: rawValue.new_payee.payee_name,
        phone_number: rawValue.new_payee.phone_number,
      };

      if (rawValue.new_payee.hasAddress && rawValue.new_payee.address.region_id) {
        newPayeePayload.address = {
            region_id: rawValue.new_payee.address.region_id,
            district_id: rawValue.new_payee.address.district_id,
            ward_id: rawValue.new_payee.address.ward_id,
        };
      }
      payload.new_payee = newPayeePayload;
    }

    this.expenseService.createExpense(payload)
      .subscribe({
        next: (response) => {
          console.log('Expense created successfully:', response);
          // FIX: Replaced alert() with console logging or modal implementation if needed
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
        error: (error) => {
          console.error('API Error during expense creation:', error);
          // FIX: Replaced alert() with console logging
          console.error('Failed to record expense. Please check input details.');
          this.isLoading = false;
        }
      });
  }
}
