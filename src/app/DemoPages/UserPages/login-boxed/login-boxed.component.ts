import { Component, signal, WritableSignal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, Validators, NonNullableFormBuilder, FormControl } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Auth } from './service/auth'; // Import AuthService

// Define the type interface for the form structure
interface LoginForm {
  // email: FormControl<string>;
  password: FormControl<string>;
  phone_number: FormControl<string>; // Adding phone number to the login form for API
}

@Component({
  selector: 'app-login-boxed',
  templateUrl: './login-boxed.component.html',
  standalone: false,
  styles: []
})
export class LoginBoxedComponent implements OnInit {

  private formBuilder = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private authService = inject(Auth);

  // State Management using Signals
  message: WritableSignal<string | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.onLogin();
  }

  // Reactive Form definition
  loginForm: FormGroup<LoginForm> = this.formBuilder.group({
    phone_number: ['', [Validators.required]],
    // email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  // Handles Login Step 1: Request OTP
  onLogin(): void {
      this.message.set(null);
      this.isLoading.set(true);

      if (this.loginForm.invalid) {
          this.loginForm.markAllAsTouched();
          this.isLoading.set(false);
          return;
      }

      const credentials = this.loginForm.getRawValue();

      this.authService.login(credentials)
          .pipe(
              finalize(() => this.isLoading.set(false))
          )
          .subscribe({
              next: () => {

                  console.log('Authentication successful. Tokens saved.');
                  // Redirect directly to the secure main application page
                  this.router.navigate(['der/account/otp'], {
                    state: {
                      phoneNumber: credentials.phone_number,
                      password: credentials.password
                    }
                  });
              },
              error: err => {
                  const errors = err?.error;

                  // 🎯 CHANGE 2: Robust error handling for DRF/Django errors

                  if (errors && errors.detail) {
                      // Case 1: Specific error from Django (e.g., {"detail": "No active account..."})
                      this.message.set(errors.detail);
                  } else if (errors && typeof errors === 'object') {
                      // Case 2: Validation errors (e.g., {"phone_number": ["This field is required."]})
                      // Flatten all error values from the object into a single message
                      const errorMessages = Object.values(errors)
                                                  .flat()
                                                  .filter(msg => typeof msg === 'string');
                      if (errorMessages.length > 0) {
                          this.message.set(errorMessages.join('; '));
                      } else {
                           // Fallback for complex/unknown object errors
                           this.message.set('Login failed due to invalid data.');
                      }
                  } else {
                      // Case 3: Network errors or simple string response
                      this.message.set('Something went wrong please try again later.');
                      console.error('Login error:', err);
                  }
              }
          });
  }

  onForgotPassword(): void {
    console.log('Forgot password clicked.');
  }
}
