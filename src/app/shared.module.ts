import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Shared Components
import { PageTitleComponent } from './Layout/Components/page-title/page-title.component';
import { LoginBoxedComponent } from './DemoPages/UserPages/login-boxed/login-boxed.component';


@NgModule({
  declarations: [
    PageTitleComponent,
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule,
    FontAwesomeModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  exports: [
    PageTitleComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FontAwesomeModule
  ]
})
export class SharedModule { }
