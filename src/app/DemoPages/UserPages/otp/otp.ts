import { Component, OnInit, signal, WritableSignal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Auth } from '../login-boxed/service/auth';

// Interface for the OTP verification payload
interface OtpForm {
  OTP: string;
}

@Component({
  selector: 'app-otp',
  templateUrl: './otp.html',
  styleUrl: './otp.scss',
  standalone: false,
})
export class Otp implements OnInit { // Renamed class from Otp to OtpComponent for consistency

  // Dependencies

  private router = inject(Router);
  private http = inject(HttpClient);
  private formBuilder = inject(NonNullableFormBuilder);
  private authService = inject(Auth); // Inject AuthService
  private baseUrl = 'http://localhost:8000/api/auth';
  readonly currentYear: number = new Date().getFullYear();
  public Copyright: string = '';
  public brand = "Daz Electronics";

  // State Management using Signals
  phoneNumber: WritableSignal<string | null> = signal(null);
  password: WritableSignal<string | null> = signal(null);
  isLoginRequest: WritableSignal<string | null> = signal(null); // Tracks if data came from Login (requires email)
  message: WritableSignal<string | null> = signal(null);
  success: WritableSignal<string | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(false);
  isResending: WritableSignal<boolean> = signal(false);

  // Reactive Form for OTP input
  otpForm: FormGroup<any> = this.formBuilder.group({
    OTP: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]],
  });

  ngOnInit(): void {
    this.getAuthDataFromRouterState();
    this.get_copyright_name();
  }


  get_copyright_name(){
    this.Copyright = `${this.brand} ${this.currentYear}`;
    return this.Copyright;
  }

  /**
   * Retrieves authentication data (phone, and optionally email) from the router state
   * to determine if the user is completing a Login or a Registration flow.
   */
  getAuthDataFromRouterState(): void {
    // router.lastSuccessfulNavigation?.extras.state is the standard way to retrieve state data
    const state = this.router.lastSuccessfulNavigation?.extras.state;

    if (state && state['phoneNumber']) {
      this.phoneNumber.set(state['phoneNumber']);
      // Email is only present for the Login flow
      if (state['password']) {
        this.password.set(state['password']);
      }

      // this.message.set(`A verification code was sent to ${this.phoneNumber()}.`);

    } else {
      console.error('Critical auth data missing from router state. Redirecting to login.');
      this.message.set('Authentication credentials were not provided');
      // Fallback: redirect back to login if critical data is missing
      setTimeout(() => this.router.navigate(['/der/account/login']), 3000);
    }
  }

  /**
   * Handles OTP verification for both Registration (confirm) and Login (verify).
   */
  onOtpSubmit(): void {
    this.message.set(null);
    this.otpForm.markAllAsTouched();

    // Check for minimum required data (phone number and valid OTP)
    if (this.otpForm.invalid || !this.phoneNumber()) {
      return;
    }

    this.isLoading.set(true);

    const isLoginVerification = !!this.password();
    const endpoint = isLoginVerification
      ? `${this.baseUrl}/login/verify-otp/`
      : `${this.baseUrl}/confirm-registration/`;

    const payload: any = {
      phone_number: this.phoneNumber(),
      OTP: this.otpForm.value.OTP,
    };

    // Add email to payload ONLY if it's a login verification
    // if (isLoginVerification) {
    //     payload.email = this.email();
    // }

    this.http.post(endpoint, payload)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (res: any) => {
          console.log('OTP validated. User authenticated.');

          if (isLoginVerification && res?.access && res?.refresh) {
            // For successful Login: store tokens in Auth Service
            this.authService.setTokens(res.access, res.refresh, res.user_data);
            this.message.set('Verification successful. Logging you in...');
          } else if (!isLoginVerification) {
            // For successful Registration: message the user and prompt them to log in
            this.message.set(res.message || 'Registration confirmed. Please proceed to login.');
          }

          // Success: Redirect to the main application dashboard (for login)
          // or to the login page (for registration)
          const redirectRoute = isLoginVerification ? '/der/dashboards' : '/der/account/login';
          this.router.navigate([redirectRoute]);
        },
        error: err => {
          const errors = err?.error;
          this.handleServerErrors(errors, this.otpForm);
          if (!errors || Object.keys(errors).length === 0) {
            this.message.set('Verification failed. Please check the code and try again.');
          }
          else{
            this.message.set(errors.error);
            this.success.set('false');
          }
        }
      });
  }

  /**
   * Resends OTP using the appropriate endpoint based on the flow (Login or Registration).
   */
  onRequestOtp(): void {
    if (!this.phoneNumber()) {
      this.message.set('Cannot resend. Phone number is missing.');
      return;
    }

    this.message.set(null);
    this.isResending.set(true);

    const isLoginFlow = !!this.password();
    const endpoint = isLoginFlow
      ? `${this.baseUrl}/request/login-otp/`
      : `${this.baseUrl}/request/registration-otp/`;

    // Payload always just needs the phone number to request a new OTP
    const payload = { phone_number: this.phoneNumber() };

    this.http.post(endpoint, payload)
      .pipe(
        finalize(() => this.isResending.set(false))
      )
      .subscribe({
        next: (res: any) => {
          console.log('OTP resent successfully.');
          this.success.set('New '+ res.message);
          this.message.set('false');
        },
        error: err => {
          const errors = err?.error;
          this.handleServerErrors(errors, this.otpForm);
          if (!errors || Object.keys(errors).length === 0) {
            this.message.set('Failed to resend OTP. Please wait and try again.');
          }
        }
      });
  }

  // Helper to handle server validation errors
  private handleServerErrors(errors: any, form: FormGroup): void {
    if (errors && typeof errors === 'object') {
      Object.keys(errors).forEach(field => {
        // Handle common API field names (e.g., otp_code or phone_number)
        const control = form.get(field === 'otp_code' ? 'otp_code' : field);
        if (control) {
          control.setErrors({ serverError: errors[field][0] });
        }
      });
    } else {
      console.error('Server error:', errors);
    }
  }
}
