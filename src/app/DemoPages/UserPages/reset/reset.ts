import { Component, OnInit } from '@angular/core';
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
  selector: 'app-reset',
  standalone: false,
  templateUrl: './reset.html',
  styleUrl: './reset.scss',
})
export class Reset implements OnInit {

    passwordForm!: FormGroup;

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
      this.passwordForm = this.fb.group({
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      }, {
        // Apply the custom validator to the entire form group
        validator: passwordMatchValidator
      });
    }

    // Helper getter to easily access form controls in the template
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
