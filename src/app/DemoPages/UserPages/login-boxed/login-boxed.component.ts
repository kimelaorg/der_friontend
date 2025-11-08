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
        next: (res: any) => {
          console.log('Login successful. Proceeding to OTP verification.');

          // Redirect to OTP and pass the necessary credentials for the next step
          this.router.navigate(['/pages/otp'], {
            state: {
              phoneNumber: credentials.phone_number,
              password: credentials.password
            }
          });
        },
        error: err => {
          const errors = err?.error;
          // Display the server's error message
          if (errors && errors.detail) {
            this.message.set(errors.detail);
          } else {
            this.message.set('Login failed. Please check your credentials or ensure you are registered.');
            console.error('Login error:', err);
          }
        }
      });
  }

  onForgotPassword(): void {
    console.log('Forgot password clicked.');
  }
}
