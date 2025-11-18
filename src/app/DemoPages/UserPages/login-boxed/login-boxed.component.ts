import { Component, ChangeDetectionStrategy, signal, WritableSignal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, Validators, NonNullableFormBuilder, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs/operators';
import { Auth } from './service/auth';
import { HttpErrorResponse } from '@angular/common/http';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: []

})
export class LoginBoxedComponent implements OnInit {

  private formBuilder = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private authService = inject(Auth);
  public brand = "Daz Electronics";
  readonly currentYear: number = new Date().getFullYear();
  public Copyright: string = '';

  // State Management using Signals
  message: WritableSignal<string | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.onLogin();
    this.get_copyright_name();
  }

  // Reactive Form definition
  loginForm: FormGroup<LoginForm> = this.formBuilder.group({
    phone_number: ['', [Validators.required]],
    // email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get_copyright_name(){
    this.Copyright = `${this.brand} ${this.currentYear}`;
    return this.Copyright;
  }

  // Handles Login Step 1: Request OTP

  onLogin(): void {
      this.message.set(null);
      this.isLoading.set(true);

      if (this.loginForm.invalid || this.loginForm.invalid) {
          // this.loginForm.markAllAsTouched();
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
              error: (err: HttpErrorResponse) => { // Type the error as HttpErrorResponse for access to status
                  const errors = err?.error;

                  // 1. Check for 400 status code (Standard for field/data validation errors)
                  if (err.status === 400 && errors) {

                      // Iterate through the field errors and map them to the form controls
                      for (const fieldName in errors) {
                          if (errors.hasOwnProperty(fieldName)) {
                              const formControl = this.loginForm.get(fieldName);
                              const serverErrors = errors[fieldName];

                              if (formControl) {
                                  // Map specific field errors (e.g., 'phone_number', 'password')
                                  formControl.setErrors({ 'server': serverErrors[0] });
                              } else if (fieldName === 'non_field_errors' || fieldName === 'detail') {
                                  // Map general/non-field errors (e.g., "Invalid credentials.")
                                  // Django/DRF often returns this as 'non_field_errors' or 'detail'
                                  this.message.set(serverErrors.join('; '));
                              }
                          }
                      }
                  } else if (errors && errors.detail) {
                      // Fallback for 401/403 or other detailed errors (e.g., "Authentication credentials were not provided.")
                      this.message.set(errors.detail);
                  } else {
                      // Network errors or unhandled server errors
                      this.message.set('Login failed. Please check your network connection and try again.');
                      console.error('Login error:', err);
                  }
              }
          });
  }

  onForgotPassword(): void {
    console.log('Forgot password clicked.');
  }
}
