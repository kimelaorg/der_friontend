import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';

// User Pages Components
import { ForgotPasswordBoxedComponent } from './DemoPages/UserPages/forgot-password-boxed/forgot-password-boxed.component';
import { LoginBoxedComponent } from './DemoPages/UserPages/login-boxed/login-boxed.component';
import { RegisterBoxedComponent } from './DemoPages/UserPages/register-boxed/register-boxed.component';
import { Otp } from './DemoPages/UserPages/otp/otp';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Profile } from './DemoPages/UserPages/profile/profile';
import { CompleteRegistration } from './DemoPages/UserPages/complete-registration/complete-registration';
import { Reset } from './DemoPages/UserPages/reset/reset';
import { ChangePassword } from './DemoPages/UserPages/change-password/change-password';

@NgModule({
  declarations: [
    ForgotPasswordBoxedComponent,
    LoginBoxedComponent,
    RegisterBoxedComponent,
    Otp,
    Profile,
    CompleteRegistration,
    Reset,
    ChangePassword
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
