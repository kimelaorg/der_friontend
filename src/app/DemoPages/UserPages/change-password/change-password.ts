import { Router } from '@angular/router';
import { Component, OnInit, signal, WritableSignal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Auth, User } from '../login-boxed/service/auth';
import { FormBuilder, FormGroup, Validators, ValidationErrors, AbstractControl } from '@angular/forms';


export const passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (!newPassword || !confirmPassword) {
    return null;
  }

  if (newPassword.value !== confirmPassword.value) {
    return { passwordsMismatch: true };
  }

  return null;
};


@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword implements OnInit {

  passwordForm!: FormGroup;
  phoneNumber: WritableSignal<string | null> = signal(null);
  code: WritableSignal<string | null> = signal(null);
  title: WritableSignal<string | null> = signal(null);
  birth_date: WritableSignal<string | null> = signal(null);
  message: WritableSignal<string | null> = signal(null);
  password_status: WritableSignal<boolean> = signal(false);

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {

    this.getAuthDataFromRouterState();


    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: passwordMatchValidator
    });
  }

  getAuthDataFromRouterState(): void {
    // router.lastSuccessfulNavigation?.extras.state is the standard way to retrieve state data
    const state = this.router.lastSuccessfulNavigation?.extras.state;

    if (state && state['title']) {
      this.title.set(state['title']);
      this.birth_date.set(state['birth_date']);

    }

    else if (state && state['code']) {
      this.phoneNumber.set(state['phoneNumber']);
      this.code.set(state['code']);

    }

    else if (state && state['password_status']) {
      this.password_status.set(state['password_status'])

      if(state['phoneNumber']){
        this.phoneNumber.set(state['phoneNumber']);
      }

    }

    // else {
    //   console.error('Critical auth data missing from router state. Redirecting to login.');
    //   this.message.set('Authentication credentials were not provided');
    //   // Fallback: redirect back to login if critical data is missing
    //   setTimeout(() => this.router.navigate(['/der/account/login']), 3000);
    // }
  }

  get f() {
    return this.passwordForm.controls;
  }

  onSubmit(): void {
    if (this.passwordForm.valid) {
      console.log('Password is valid and matches:', this.passwordForm.value.newPassword);
      // Logic to update the user's password goes here
    } else {
      console.log('Form is invalid. Check errors.');
      // Mark all fields as touched to display errors immediately
      this.passwordForm.markAllAsTouched();
    }
  }
}
