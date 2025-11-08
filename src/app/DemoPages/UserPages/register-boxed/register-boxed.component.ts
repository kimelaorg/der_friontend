import { Component, signal, WritableSignal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, NonNullableFormBuilder } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

// Define the type interface for the form structure
interface RegisterForm {
  phone_number: FormControl<string>;
  email: FormControl<string>;
  first_name: FormControl<string>;
  last_name: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-register-boxed',
  templateUrl: './register-boxed.component.html',
  standalone: false,
  styles: []
})
export class RegisterBoxedComponent {

  http = inject(HttpClient);
  private formBuilder = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private baseUrl = 'http://localhost:8000/api/auth';

  message: WritableSignal<string | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(false);

  registerForm: FormGroup<RegisterForm> = this.formBuilder.group({
    phone_number: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onRegister(): void {

    this.message.set(null);
    this.isLoading.set(true);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.isLoading.set(false);
      return;
    }

    const formValue = this.registerForm.getRawValue();

    this.http.post(`${this.baseUrl}/register/`, formValue)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (res: any) => {
          console.log('User registered successfully');

          this.router.navigate(['/pages/otp'], {
            state: {
              phoneNumber: formValue.phone_number
            }
          });

        },
        error: err => {
          const errors = err?.error;
          if (errors && typeof errors === 'object') {
            // Server-side validation handling
            Object.keys(errors).forEach(field => {
              const control = this.registerForm.get(field);
              if (control) {
                control.setErrors({ serverError: errors[field][0] });
              }
            });
          } else {
            // General error message (e.g., network failure)
            this.message.set('An unexpected error occurred. Please try again.');
            console.error('Unexpected registration error:', err);
          }
        }
      });
  }
}
