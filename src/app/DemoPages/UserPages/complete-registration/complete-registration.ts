import { Component, OnInit, signal, ViewChild, WritableSignal, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Registration, LocationDetail } from './registration';

@Component({
  selector: 'app-complete-registration',
  standalone: false,
  templateUrl: './complete-registration.html',
  styleUrl: './complete-registration.scss',
})
export class CompleteRegistration implements OnInit {

  // --- Stage Management ---
  currentStage = signal(1);
  stages = ['Personal Info', 'Residential Info', 'Next of Kin', 'Review & Complete'];
  isSubmitting = signal(false);
  public Copyright: string = '';
  public brand = "Daz Electronics";
  readonly currentYear: number = new Date().getFullYear();

  // --- Profile Picture Management ---
  profileImageUrl = signal('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJwAAACUCAMAAABRNbASAAAAMFBMVEXk5ueutLfn6eqrsbTh4+S0ubzd4OG7wMLKztDS1dfW2drAxcfN0dPEyMqorrG4vcBqnWuJAAAESElEQVR4nO2b25arIAyGJRzkpL7/226w1WrHtggJuPbyv5lp52K+FUggIem6W7du3bp169atW1UFAK0R/ioyCWWN995YJR5fXEIAwmon+TjyqPBDOm3FJfDAOsk4Z1uFj9LZ1uYDpeW4B1s1Mq8a4gFo+YHsYUA5tLIedIZ/Q5vxmG/DpvpfaPPiuhZr61kKW5SpTjeMiWi//... (your existing base64) ...');
  selectedProfileFile: File | null = null;
  @ViewChild('profileUploadModal') profileUploadModal!: ElementRef;

  // --- Form Definitions ---
  registrationForm!: FormGroup;
  private readonly apiUrl = 'http://localhost:8000/api/auth/complete-registration/';

  // --- Location Data State ---
  regions: LocationDetail[] = [];
  districts: LocationDetail[] = [];
  wards: LocationDetail[] = [];
  streets: LocationDetail[] = [];

  // --- Location Selection State (Helper variables) ---
  selectedRegionId: number | null = null;
  selectedDistrictName: string | null = null;
  selectedWardName: string | null = null;
  phoneNumber: WritableSignal<string | null> = signal(null);
  message: WritableSignal<string | null> = signal(null);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private modalService: NgbModal,
    private locationService: Registration
  ) {}

  ngOnInit(): void {

    this.get_copyright_name()

    // this.getAuthDataFromRouterState();

    this.registrationForm = this.fb.group({
      // STAGE 1: Personal Info
      personalInfo: this.fb.group({
        second_phone_number: [''],
        first_name: ['', [Validators.required, Validators.maxLength(30)]],
        middle_name: ['', [Validators.maxLength(100)]],
        last_name: ['', [Validators.required, Validators.maxLength(100)]],
        email: ['', [Validators.email]],
        title: ['', [Validators.required]],
        birth_date: ['', [Validators.required]],
      }),

      // STAGE 2: Residential Info
      address: this.fb.group({
        region_id: ['', [Validators.required]],
        district: ['', [Validators.required, Validators.maxLength(100)]],
        ward: ['', [Validators.required, Validators.maxLength(100)]],
        street: ['', [Validators.required, Validators.maxLength(100)]],
        post_code: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^[0-9]+$/)]],
        street_prominent_name: [''],
        house_number: ['', [Validators.maxLength(20)]],
        plot_number: [''],
      }),

      // STAGE 3: Next of Kin
      next_of_kin: this.fb.array(
        [],
        [Validators.required]
      ),
    });

    this.addNextOfKin();
    this.loadRegions();
  }

  get_copyright_name(){
    this.Copyright = `${this.brand} ${this.currentYear}`;
    return this.Copyright;
  }


  getAuthDataFromRouterState(): void {
    // router.lastSuccessfulNavigation?.extras.state is the standard way to retrieve state data
    const state = this.router.lastSuccessfulNavigation?.extras.state;

    if (state && state['phoneNumber']) {
      this.phoneNumber.set(state['phoneNumber']);

    } else {
      console.error('Critical auth data missing from router state. Redirecting to login.');
      this.message.set('Authentication credentials were not provided');
      // Fallback: redirect back to login if critical data is missing
      setTimeout(() => this.router.navigate(['/der/account/login']), 3000);
    }
  }

  // --- Location Cascade Methods (Using Service) ---

  loadRegions(): void {
    this.locationService.getRegions().subscribe(data => {
      this.regions = data;
    });
  }

  onRegionSelected(event: Event): void {
    const regionIdStr = (event.target as HTMLSelectElement).value;
    const regionId = parseInt(regionIdStr, 10);
    this.selectedRegionId = regionId;

    // Reset lower fields
    this.registrationForm.get('address.district')?.setValue('');
    this.registrationForm.get('address.ward')?.setValue('');
    this.registrationForm.get('address.street')?.setValue('');
    this.registrationForm.get('address.post_code')?.setValue('');
    this.districts = this.wards = this.streets = [];
    this.selectedDistrictName = this.selectedWardName = null;

    if (this.selectedRegionId) {
      this.locationService.getDistricts(this.selectedRegionId).subscribe(data => {
        this.districts = data;
      });
    }
  }

  onDistrictSelected(event: Event): void {
    const districtName = (event.target as HTMLSelectElement).value;
    this.selectedDistrictName = districtName;

    // Reset lower fields
    this.registrationForm.get('address.ward')?.setValue('');
    this.registrationForm.get('address.street')?.setValue('');
    this.registrationForm.get('address.post_code')?.setValue('');
    this.wards = this.streets = [];
    this.selectedWardName = null;

    if (this.selectedRegionId && districtName) {
      this.locationService.getWards(this.selectedRegionId, districtName).subscribe(data => {
        this.wards = data;
      });
    }
  }

  onWardSelected(event: Event): void {
    const wardName = (event.target as HTMLSelectElement).value;
    this.selectedWardName = wardName;

    // Reset lower fields
    this.registrationForm.get('address.street')?.setValue('');
    this.registrationForm.get('address.post_code')?.setValue('');
    this.streets = [];

    if (this.selectedRegionId && wardName) {
      this.locationService.getStreets(this.selectedRegionId, wardName).subscribe(data => {
        this.streets = data;
      });
    }
  }

  onStreetSelected(event: Event): void {
    const streetName = (event.target as HTMLSelectElement).value;
    this.registrationForm.get('address.post_code')?.setValue('');

    const selectedStreet = this.streets.find(s => s.name === streetName);

    if (selectedStreet && selectedStreet.post_code) {
      this.registrationForm.get('address.post_code')?.setValue(selectedStreet.post_code);
    }
  }

  // --- FormArray Accessor and Methods ---
  get nextOfKinControls() {
    return this.registrationForm.get('next_of_kin') as FormArray;
  }

  private createNextOfKinGroup(): FormGroup {
    return this.fb.group({
      id: [''],
      // Ensure phone_number and address have only necessary validators to avoid hidden failures
      phone_number: ['', [Validators.required]],
      first_name: ['', [Validators.required, Validators.maxLength(100)]],
      last_name: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.email]],
      physical_address: ['', [Validators.required, Validators.maxLength(200)]],
    });
  }

  addNextOfKin(): void {
    this.nextOfKinControls.push(this.createNextOfKinGroup());
    if (this.nextOfKinControls.length > 0 && this.nextOfKinControls.errors) {
        this.nextOfKinControls.setErrors(null);
    }
  }

  removeNextOfKin(index: number): void {
    if (this.nextOfKinControls.length > 1) {
        this.nextOfKinControls.removeAt(index);
    } else {
        alert("You must have at least one Next of Kin entry.");
        this.nextOfKinControls.setErrors({'required': true});
    }
  }

  // --- General Form & Navigation Methods ---

  getCurrentFormGroup(): FormGroup | FormArray {
    const stageKey = this.getStageKey(this.currentStage());
    const control = this.registrationForm.get(stageKey);
    return control as FormGroup | FormArray;
  }

  private getStageKey(stage: number): string {
    switch(stage) {
      case 1: return 'personalInfo';
      case 2: return 'address';
      case 3: return 'next_of_kin';
      default: return '';
    }
  }

  nextStage(): void {
    if (this.currentStage() < this.stages.length) {
      const currentControl = this.getCurrentFormGroup();

      currentControl.markAllAsTouched();

      if (currentControl instanceof FormArray && currentControl.length === 0) {
        currentControl.setErrors({'required': true});
        return;
      }

      if (currentControl.valid) {
        this.currentStage.update(stage => stage + 1);
      } else {
        console.error(`Validation failed for stage ${this.currentStage()}. Status: ${currentControl.status}`);
        // Optionally, check errors of first control in FormArray for debugging:
        if (currentControl instanceof FormArray && currentControl.length > 0) {
            console.error('First Next of Kin errors:', currentControl.controls[0].errors);
        }
      }
    }
  }

  prevStage(): void {
    if (this.currentStage() > 1) {
      this.currentStage.update(stage => stage - 1);
    }
  }

  // --- Modal and Image methods ---

  openProfileModal(): void {
    this.modalService.open(this.profileUploadModal, {
        ariaLabelledBy: 'modal-title',
        backdrop: 'static'
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedProfileFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
          this.profileImageUrl.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  uploadFile(): void {
    if (this.selectedProfileFile) {
        // Placeholder for actual API upload logic
        this.modalService.dismissAll();
    } else {
        alert("Please select a file first.");
    }
  }

  // --- Final Submission ---

  onSubmit(): void {
    if (this.registrationForm.valid) {
      this.isSubmitting.set(true);

      this.registrationForm.get('address.post_code')?.enable();

      const personalInfo = this.registrationForm.get('personalInfo')?.value;

      const payload = {
        // phone_number: personalInfo.phone_number,
        second_phone_number: personalInfo.second_phone_number,
        first_name: personalInfo.first_name,
        middle_name: personalInfo.middle_name,
        last_name: personalInfo.last_name,
        email: personalInfo.email,
        title: personalInfo.title,
        birth_date: personalInfo.birth_date,

        address: this.registrationForm.get('address')?.value,
        next_of_kin: this.registrationForm.get('next_of_kin')?.value,
      };

      this.http.put(this.apiUrl, payload)
        .pipe(
          catchError(this.handleError.bind(this))
        )
        .subscribe({
          next: (response) => {
            console.log('Registration Successful!', response);
            this.router.navigate(['der/account/change-password'], {
              state: {
                  title: personalInfo.title,
                  birth_date: personalInfo.birth_date
              }
            });
            // this.currentStage.set(5);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.registrationForm.get('address.post_code')?.disable();
          },
          complete: () => {
            this.isSubmitting.set(false);
            this.registrationForm.get('address.post_code')?.disable();
          }
        });
    } else {
      this.registrationForm.markAllAsTouched();
      console.error('Final submission failed validation. Check all stages.');
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.isSubmitting.set(false);
    if (error.status === 400 && error.error) {
      console.error('Backend Validation Error:', error.error);
      alert('Registration failed due to validation errors. Check console for details.');
    } else {
      console.error(`An unexpected error occurred: code ${error.status}`);
    }
    return throwError(() => new Error('Registration error. Please try again.'));
  }
}
