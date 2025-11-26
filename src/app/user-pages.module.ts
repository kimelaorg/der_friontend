import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';

// User Pages Components
import { ForgotPasswordBoxedComponent } from './DemoPages/UserPages/forgot-password-boxed/forgot-password-boxed.component';
import { LoginBoxedComponent } from './DemoPages/UserPages/login-boxed/login-boxed.component';
import { RegisterBoxedComponent } from './DemoPages/UserPages/register-boxed/register-boxed.component';
import { Otp } from './DemoPages/UserPages/otp/otp';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    ForgotPasswordBoxedComponent,
    LoginBoxedComponent,
    RegisterBoxedComponent,
    Otp
  ],
  imports: [
    SharedModule,
    MatProgressSpinnerModule
  ],
  exports: [
    ForgotPasswordBoxedComponent,
    LoginBoxedComponent,
    RegisterBoxedComponent,
    Otp,
    MatProgressSpinnerModule
  ]
})
export class UserPagesModule { }
