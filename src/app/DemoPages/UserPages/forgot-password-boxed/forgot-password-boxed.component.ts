import { Component } from '@angular/core';

@Component({
  selector: 'app-forgot-password-boxed',
  templateUrl: './forgot-password-boxed.component.html',
  standalone: false,
  styles: []
})
export class ForgotPasswordBoxedComponent {

  constructor() { }

  readonly currentYear: number = new Date().getFullYear();

  onSubmit() {
    // Handle password recovery form submission
  }

}
