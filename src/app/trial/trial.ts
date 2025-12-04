import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome'; // Mocked or assumed to be imported
import { faSearch, faPlus, faTable } from '@fortawesome/free-solid-svg-icons'; // Mocked or assumed to be imported

// --- INTERFACE DEFINITIONS (Mock) ---
interface ExpenseRecord {
  id: string;
  expense_date: Date;
  amount: number;
  description: string;
  category: { id: string, name: string };
  payment_method: string;
  payee: {
    id: string;
    name: string;
    phone_number: string;
    address: { region: string, district: string, ward: string, street: string };
  };
}

interface Category {
  id: string;
  name: string;
}

interface Payee {
  id: string;
  name: string;
}

interface Region {
    name: string;
    districts: { name: string; wards: { id: string, name: string }[] }[];
}


@Component({
  selector: 'app-trial',
  standalone: false,
  template: `
    <div class="app-container">

      <!-- Custom Component Mock -->
      <div class="custom-page-title">
        <h1 class="text-3xl font-bold text-gray-800">{{ heading }}</h1>
        <p class="text-sm text-gray-500">{{ subheading }}</p>
      </div>

      <!-- FLIPPING CONTAINER WRAPPER -->
      <div class="flip-wrapper-container">
        <div class="flip-card-3d" [class.flipped]="isFlipped()">

          <!-- FRONT SIDE: VIEW RECORDS (Table) -->
          <div class="card-side front-side">
            <div class="p-4 md:p-6 h-full flex flex-col">
              <div class="d-flex flex-wrap align-items-center mb-4 justify-content-between">
                <h3 class="text-xl font-semibold text-primary">Expense Records (View)</h3>
                <button (click)="toggleView('create')" class="btn btn-primary d-flex items-center">
                    <fa-icon [icon]="faPlus" class="me-2"></fa-icon>
                    Add New Expense
                </button>
              </div>

              <!-- Filters and Search -->
              <div class="d-flex flex-wrap align-items-center mb-3 justify-content-between">

                <div class="d-flex align-items-center me-3 mb-2 mb-md-0">
                    <label for="salesFilter" class="form-label me-2 fw-bold mb-0">Filter Records By:</label>
                    <select
                        id="salesFilter"
                        class="form-select w-auto"
                        [(ngModel)]="selectedFilter"
                        (change)="onFilterChange()">
                        <option value="all">-- Show All Records --</option>
                        <optgroup label="Daily Records">
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="day-before-yesterday">Day Before Yesterday</option>
                        </optgroup>
                    </select>
                </div>

                <div class="input-group w-auto flex-grow-1" style="max-width: 300px;">
                    <span class="input-group-text"><fa-icon [icon]="faSearch"></fa-icon></span>
                    <input
                        type="text"
                        class="form-control"
                        placeholder="Search Payee, Category, or Location..."
                        [(ngModel)]="searchText"
                        (ngModelChange)="onSearchChange()" >
                </div>
              </div>

              <!-- Table Content -->
              <div *ngIf="expensesRecords.length === 0 && totalRecords === 0" class="alert alert-info mt-3" role="alert">
                  No expense records found matching the current search and filter criteria.
              </div>

              <div class="table-responsive flex-grow" style="overflow-y: auto;">
                  <table class="align-middle text-truncate mb-0 table table-borderless table-hover">
                      <thead>
                          <tr class="text-uppercase text-gray-600 bg-gray-50">
                              <th class="py-3">#</th>
                              <th>Expense Date</th>
                              <th>Amount</th>
                              <th>Category</th>
                              <th>Payment Method</th>
                              <th>Description</th>
                              <th>Payee Name</th>
                              <th>Location</th>
                              <th>Action</th>
                          </tr>
                      </thead>
                      <tbody>
                          <ng-container *ngFor="let record of expensesRecords; let i = index">
                              <tr class="hover:bg-blue-50 transition-colors duration-150">
                                  <td>{{ i + 1 + (currentPage - 1) * itemsPerPage }}</td>
                                  <td>{{ record.expense_date | date:'MMM d, y' }}</td>
                                  <td>
                                      <span
                                          [class]="{
                                              'text-danger fw-bold': +record.amount < 0,
                                              'text-success fw-bold': +record.amount >= 0
                                          }">
                                          {{ record.amount | currency: 'TZS': 'symbol' }}
                                      </span>
                                  </td>
                                  <td>{{ record.category.name }}</td>
                                  <td>
                                      {{ record.payment_method === 'Mobile Money' ? 'MOMO' : record.payment_method }}
                                  </td>
                                  <td>
                                      <span title="{{ record.description }}">
                                          {{ record.description | slice:0:30 }}{{ record.description.length > 30 ? '...' : '' }}
                                      </span>
                                  </td>
                                  <td>{{ record.payee.name }}</td>
                                  <td>
                                      {{ record.payee.address.region }}, {{ record.payee.address.district }}
                                  </td>
                                  <td>
                                      <button
                                          class="btn btn-sm btn-outline-info w-100"
                                          type="button"
                                          data-bs-toggle="collapse"
                                          [attr.data-bs-target]="'#details-' + i"
                                          aria-expanded="false"
                                          [attr.aria-controls]="'details-' + i">
                                          Details
                                      </button>
                                  </td>
                              </tr>

                              <!-- Collapsible Row for Nested Details -->
                              <tr>
                                  <td colspan="9" class="p-0 border-0">
                                      <div class="collapse" [id]="'details-' + i">
                                          <div class="card card-body bg-light m-2 rounded-lg">
                                              <h5 class="text-lg font-medium text-gray-700">Details for Payee: {{ record.payee.name }}</h5>
                                              <table class="table table-sm table-bordered mb-0 bg-white">
                                                  <tbody>
                                                      <tr>
                                                          <th class="w-1/4">ID</th>
                                                          <td class="w-1/4">{{ record.id }}</td>
                                                          <th class="w-1/4">Phone</th>
                                                          <td class="w-1/4">{{ record.payee.phone_number }}</td>
                                                      </tr>
                                                      <tr>
                                                          <th>Address</th>
                                                          <td colspan="3">
                                                              {{ record.payee.address.street }},
                                                              {{ record.payee.address.ward }},
                                                              {{ record.payee.address.district }},
                                                              {{ record.payee.address.region }}
                                                          </td>
                                                      </tr>
                                                  </tbody>
                                              </table>
                                          </div>
                                      </div>
                                  </td>
                              </tr>
                          </ng-container>
                      </tbody>
                  </table>
              </div>

              <!-- Pagination -->
              <div class="d-flex justify-content-between align-items-center mt-4 border-t pt-3">
                  <div class="small text-muted">
                      Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ (currentPage - 1) * itemsPerPage + expensesRecords.length }} of {{ totalRecords }} records
                  </div>
                  <nav *ngIf="totalPages > 1">
                      <ul class="pagination pagination-sm mb-0 shadow-sm rounded-lg">
                          <li class="page-item" [class.disabled]="currentPage === 1">
                              <a class="page-link cursor-pointer" (click)="goToPage(currentPage - 1)">Previous</a>
                          </li>
                          <li class="page-item active">
                              <a class="page-link">{{ currentPage }}</a>
                          </li>
                          <li class="page-item" [class.disabled]="currentPage === totalPages">
                              <a class="page-link cursor-pointer" (click)="goToPage(currentPage + 1)">Next</a>
                          </li>
                      </ul>
                  </nav>
              </div>

            </div>
          </div>

          <!-- BACK SIDE: CREATE EXPENSE (Form) -->
          <div class="card-side back-side">
            <div class="p-4 md:p-6 h-full flex flex-col">

                <div class="d-flex flex-wrap align-items-center mb-4 justify-content-between">
                    <h3 class="text-xl font-semibold text-primary">Daily Expense Submission (Create)</h3>
                    <button (click)="toggleView('view')" class="btn btn-outline-secondary d-flex items-center">
                        <fa-icon [icon]="faTable" class="me-2"></fa-icon>
                        View Records
                    </button>
                </div>

                <div class="card shadow-md flex-grow overflow-y-auto">
                    <div class="card-header bg-primary text-white p-3 rounded-t-lg">
                        <h4 class="mb-0">Enter New Expense Details</h4>
                    </div>
                    <div class="card-body p-4">

                        <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()">

                            <div class="row g-3 mb-4 border-bottom pb-3">
                                <h5 class="text-secondary text-base font-medium">Core Expense Details <span class="text-danger">*</span></h5>

                                <div class="col-md-6">
                                    <label for="amount" class="form-label">Amount</label>
                                    <div class="input-group">
                                        <span class="input-group-text">TZS</span>
                                        <input id="amount" type="number" step="0.01" class="form-control" formControlName="amount" placeholder="e.g. 7000.00">
                                    </div>
                                    <div *ngIf="expenseForm.get('amount')?.invalid && (expenseForm.get('amount')?.touched || isSubmitted)" class="text-danger small mt-1">
                                        Amount is required and must be positive.
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <label for="paymentMethod" class="form-label">Payment Method</label>
                                    <select id="paymentMethod" class="form-select" formControlName="payment_method">
                                        <option [ngValue]="null" disabled>Select method</option>
                                        <option *ngFor="let method of paymentMethods" [ngValue]="method">{{ method }}</option>
                                    </select>
                                    <div *ngIf="expenseForm.get('payment_method')?.invalid && (expenseForm.get('payment_method')?.touched || isSubmitted)" class="text-danger small mt-1">
                                        Payment method is required.
                                    </div>
                                </div>

                                <div class="col-12">
                                    <label for="description" class="form-label">Description</label>
                                    <input id="description" type="text" class="form-control" formControlName="description" placeholder="What did you spend money on?">
                                    <div *ngIf="expenseForm.get('description')?.invalid && (expenseForm.get('description')?.touched || isSubmitted)" class="text-danger small mt-1">
                                        Description is required.
                                    </div>
                                </div>
                            </div>


                            <div class="mb-4 border-bottom pb-3">
                                <h5 class="text-secondary text-base font-medium">Category <span class="text-danger">*</span></h5>

                                <div class="btn-group w-100 mb-3 rounded-lg shadow-sm" role="group">
                                    <input type="radio" class="btn-check" id="catExisting" value="existing" formControlName="category_choice" autocomplete="off">
                                    <label class="btn btn-outline-info" for="catExisting">Use Existing Category</label>

                                    <input type="radio" class="btn-check" id="catNew" value="new" formControlName="category_choice" autocomplete="off">
                                    <label class="btn btn-outline-info" for="catNew">Create New Category</label>
                                </div>

                                <div *ngIf="expenseForm.get('category_choice')?.value === 'existing'" class="mb-3">
                                    <label for="categoryId" class="form-label">Select Category</label>
                                    <select id="categoryId" class="form-select" formControlName="category_id" [disabled]="existingCategories.length === 0">
                                        <option [ngValue]="null" disabled>{{ existingCategories.length > 0 ? 'Choose from list' : 'Loading categories...' }}</option>
                                        <option *ngFor="let cat of existingCategories" [ngValue]="cat.id">{{ cat.name }}</option>
                                    </select>
                                    <div *ngIf="expenseForm.hasError('categoryMissing') && isSubmitted" class="text-danger small mt-1">
                                        A category must be selected.
                                    </div>
                                </div>

                                <div *ngIf="expenseForm.get('category_choice')?.value === 'new'" formGroupName="new_category">
                                    <label for="newCategoryName" class="form-label">New Category Name</label>
                                    <input id="newCategoryName" type="text" class="form-control" formControlName="name" placeholder="e.g. Pet Supplies">
                                    <div *ngIf="newCategory.get('name')?.invalid && (newCategory.get('name')?.touched || isSubmitted)" class="text-danger small mt-1">
                                        New category name is required.
                                    </div>
                                </div>
                            </div>


                            <div class="mb-4 border-bottom pb-3">
                                <h5 class="text-secondary text-base font-medium">Payee Details <span class="text-muted small">(Optional)</span></h5>

                                <div class="btn-group w-100 mb-3 rounded-lg shadow-sm" role="group">
                                    <input type="radio" class="btn-check" id="payeeNone" value="none" formControlName="payee_choice" autocomplete="off">
                                    <label class="btn btn-outline-secondary" for="payeeNone">No Payee</label>
                                    <input type="radio" class="btn-check" id="payeeExisting" value="existing" formControlName="payee_choice" autocomplete="off">
                                    <label class="btn btn-outline-secondary" for="payeeExisting">Use Existing Payee</label>
                                    <input type="radio" class="btn-check" id="payeeNew" value="new" formControlName="payee_choice" autocomplete="off">
                                    <label class="btn btn-outline-secondary" for="payeeNew">Create New Payee</label>
                                </div>

                                <div *ngIf="expenseForm.get('payee_choice')?.value === 'existing'" class="mb-3">
                                    <label for="payeeId" class="form-label">Select Payee</label>
                                    <select id="payeeId" class="form-select" formControlName="payee_id" [disabled]="existingPayees.length === 0">
                                        <option [ngValue]="null" disabled>{{ existingPayees.length > 0 ? 'Choose from list' : 'Loading payees...' }}</option>
                                        <option *ngFor="let payee of existingPayees" [ngValue]="payee.id">{{ payee.name }}</option>
                                    </select>
                                    <div *ngIf="expenseForm.hasError('payeeMissing') && isSubmitted" class="text-danger small mt-1">
                                        A payee must be selected.
                                    </div>
                                </div>

                                <div *ngIf="expenseForm.get('payee_choice')?.value === 'new'" formGroupName="new_payee" class="card card-body bg-light shadow-inner">
                                    <h6 class="card-title text-dark font-semibold">New Payee Information</h6>
                                    <div class="row g-3">
                                        <div class="col-md-6 mb-3">
                                            <label for="payeeName" class="form-label">Payee Name <span class="text-danger">*</span></label>
                                            <input id="payeeName" type="text" class="form-control" formControlName="payee_name" placeholder="e.g. John's Taxi">
                                            <div *ngIf="newPayee.get('payee_name')?.invalid && (newPayee.get('payee_name')?.touched || isSubmitted)" class="text-danger small mt-1">
                                                Payee name is required.
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="phoneNumber" class="form-label">Phone Number <span class="text-muted small">(Optional)</span></label>
                                            <input id="phoneNumber" type="tel" class="form-control" formControlName="phone_number">
                                        </div>
                                    </div>

                                    <div class="form-check form-switch mb-3">
                                        <input class="form-check-input cursor-pointer" type="checkbox" role="switch" id="toggleAddress" formControlName="hasAddress">
                                        <label class="form-check-label" for="toggleAddress">Include Payee Address Details</label>
                                    </div>

                                    <div *ngIf="newPayee.get('hasAddress')?.value" formGroupName="address" class="border p-3 rounded bg-white">
                                        <h6 class="text-info font-medium">Address Details</h6>
                                        <div class="row g-3">

                                            <div class="col-md-4">
                                                <label for="regionId" class="form-label">Region <span class="text-danger">*</span></label>
                                                <select id="regionId" class="form-select" formControlName="region_id" [disabled]="regions.length === 0">
                                                    <option [ngValue]="null" disabled>{{ regions.length > 0 ? 'Select Region' : 'Loading regions...' }}</option>
                                                    <option *ngFor="let region of regions" [ngValue]="region.name">{{ region.name }}</option>
                                                </select>
                                                <div *ngIf="newPayeeAddress.get('region_id')?.invalid && (newPayeeAddress.get('region_id')?.touched || isSubmitted)" class="text-danger small mt-1">
                                                    Region is required.
                                                </div>
                                            </div>

                                            <div class="col-md-4">
                                                <label for="districtId" class="form-label">District</label>
                                                <select id="districtId" class="form-select" formControlName="district_id"
                                                    [disabled]="!newPayeeAddress.get('region_id')?.value || districts.length === 0">
                                                    <option [ngValue]="null" disabled>
                                                        {{ newPayeeAddress.get('region_id')?.value ? (districts.length > 0 ? 'Select District' : 'Loading districts...') : 'Select Region First' }}
                                                    </option>
                                                    <option *ngFor="let district of districts" [ngValue]="district.name">{{ district.name }}</option>
                                                </select>
                                            </div>

                                            <div class="col-md-4">
                                                <label for="wardId" class="form-label">Ward</label>
                                                <select id="wardId" class="form-select" formControlName="ward_id"
                                                    [disabled]="!newPayeeAddress.get('district_id')?.value || wards.length === 0">
                                                    <option [ngValue]="null" disabled>
                                                        {{ newPayeeAddress.get('district_id')?.value ? (wards.length > 0 ? 'Select Ward' : 'Loading wards...') : 'Select District First' }}
                                                    </option>
                                                    <option *ngFor="let ward of wards" [ngValue]="ward.id">{{ ward.name }}</option>
                                                </select>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Submit Button -->
                            <div class="d-grid gap-2 sticky-bottom p-3 -mx-4 -mb-4 bg-white border-t rounded-b-lg">
                                <button type="submit" class="btn btn-success btn-lg" [disabled]="expenseForm.invalid || isLoading">
                                    <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {{ isLoading ? 'Saving...' : 'Record Expense' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
          </div>

        </div>
      </div>

      <!-- Modal for Custom Confirmation -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="modal-content">
          <h4 class="text-xl font-bold mb-3 text-red-600">Confirmation Required</h4>
          <p class="mb-4">{{ modalMessage() }}</p>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-danger" (click)="handleModalAction()">{{ modalActionLabel() }}</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* Core Tailwind Utilities (Simulated using Bootstrap and Custom Classes) */
    .app-container {
      padding: 1rem;
      background-color: #f8f9fa; /* bg-gray-50 */
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: 'Inter', sans-serif;
    }

    /* FLIPPING STYLES */
    .flip-wrapper-container {
      position: relative;
      width: 100%;
      /* Max width for desktop readability */
      max-width: 1000px;
      /* Fixed height is often necessary for flip, but adjust for content */
      height: 85vh;
      min-height: 600px;
      perspective: 1500px;
      margin-top: 20px;
      border-radius: 0.75rem; /* rounded-xl */
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* shadow-2xl */
    }

    .flip-card-3d {
      position: absolute;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      transition: transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1);
      transform-origin: center center;
      border-radius: 0.75rem;
    }

    .flip-card-3d.flipped {
      transform: rotateY(180deg);
    }

    .card-side {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 0.75rem;
      background-color: white;
      overflow: hidden; /* Important for nested scrolling and containing content */
    }

    .front-side {
      z-index: 2;
      transform: rotateY(0deg);
    }

    .back-side {
      transform: rotateY(180deg);
      overflow-y: hidden; /* Prevent form content from overflowing the card */
    }

    .card-body {
        /* Ensure card body inside back side is contained */
        height: calc(100% - 4rem); /* Adjust based on header/footer size */
        overflow-y: auto;
    }

    /* Bootstrap/Custom Overrides */
    .btn-primary { background-color: #007bff; border-color: #007bff; transition: transform 0.1s; }
    .btn-primary:hover { background-color: #0056b3; border-color: #004085; transform: translateY(-1px); }
    .btn-success { background-color: #28a745; border-color: #28a745; transition: background-color 0.2s; }
    .btn-success:hover { background-color: #1e7e34; border-color: #1c7430; }

    /* Modal Styles */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1050;
    }
    .modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .flip-wrapper-container {
            height: 90vh; /* Allow more vertical space on small screens */
            min-height: 500px;
        }
    }
  `],
})
export class Trial implements OnInit {
    // Inject FormBuilder
    private fb = inject(FormBuilder);

    // --- FLIPPING LOGIC ---
    currentView = signal<'view' | 'create'>('view');
    isFlipping = signal(false); // Used to disable interaction during flip

    // Computed Signal for CSS class binding
    isFlipped = computed(() => this.currentView() === 'create');

    toggleView(target: 'view' | 'create'): void {
        if (this.isFlipping()) return;

        // Ensure the current view is the opposite of the target to avoid re-flipping
        if (this.currentView() === target) {
             console.log('Already on target view:', target);
             return;
        }

        this.isFlipping.set(true);

        // 1. Flip the card (changes the computed isFlipped signal)
        this.currentView.set(target);

        // 2. Wait for the CSS transition (0.8s) before allowing further clicks
        setTimeout(() => {
            this.isFlipping.set(false);
        }, 800); // Matches transition duration in CSS
    }

    // --- TEMPLATE & COMPONENT PROPERTIES (MOCK) ---
    heading = 'Daily Expenses Tracker';
    subheading = 'Manage and submit field expense records.';
    icon = 'wallet'; // Mock icon property

    // Font Awesome Icons (Mock)
    faSearch = faSearch;
    faPlus = faPlus;
    faTable = faTable;

    // --- TABLE DATA AND PAGINATION (MOCK) ---
    selectedFilter = 'all';
    searchText = '';

    currentPage = 1;
    itemsPerPage = 5;
    totalRecords = 12; // Mock total

    get totalPages(): number {
        return Math.ceil(this.totalRecords / this.itemsPerPage);
    }

    expensesRecords: ExpenseRecord[] = [
        // Mock data to populate the table
        {
            id: 'EXP-001', expense_date: new Date('2025-11-01'), amount: 5000, description: 'Fuel for transport',
            category: { id: 'CAT-001', name: 'Transport' }, payment_method: 'Cash',
            payee: { id: 'PAY-001', name: "Gas Station A", phone_number: '255781234567',
                address: { region: 'Dar es Salaam', district: 'Kinondoni', ward: 'Mbezi Beach', street: 'Sam Nujoma Rd' }
            }
        },
        {
            id: 'EXP-002', expense_date: new Date('2025-11-01'), amount: 15000, description: 'Lunch for client meeting',
            category: { id: 'CAT-002', name: 'Meals' }, payment_method: 'Mobile Money',
            payee: { id: 'PAY-002', name: "Mama Pima Restaurant", phone_number: '255678901234',
                address: { region: 'Dar es Salaam', district: 'Ilala', ward: 'Kariakoo', street: 'Lumumba St' }
            }
        },
        {
            id: 'EXP-003', expense_date: new Date('2025-11-02'), amount: 7500, description: 'Stationery purchase',
            category: { id: 'CAT-003', name: 'Supplies' }, payment_method: 'Cash',
            payee: { id: 'PAY-003', name: "Office Mart", phone_number: '255765432109',
                address: { region: 'Arusha', district: 'Arusha City', ward: 'Sombetini', street: 'Market St' }
            }
        },
        {
            id: 'EXP-004', expense_date: new Date('2025-11-03'), amount: 25000, description: 'Accommodation for training',
            category: { id: 'CAT-004', name: 'Travel' }, payment_method: 'Bank Transfer',
            payee: { id: 'PAY-004', name: "Sunrise Lodge", phone_number: '255754112233',
                address: { region: 'Mwanza', district: 'Nyamagana', ward: 'Isamilo', street: 'Lake Rd' }
            }
        },
        {
            id: 'EXP-005', expense_date: new Date('2025-11-03'), amount: 1000, description: 'Water refill',
            category: { id: 'CAT-002', name: 'Meals' }, payment_method: 'Cash',
            payee: { id: 'PAY-005', name: "Local Kiosk", phone_number: '',
                address: { region: 'Mwanza', district: 'Nyamagana', ward: 'Isamilo', street: 'Nyerere Rd' }
            }
        },
    ];

    onFilterChange(): void {
        console.log('Filter changed to:', this.selectedFilter);
        // Implement filtering logic here
        this.goToPage(1); // Reset to first page
    }

    onSearchChange(): void {
        console.log('Search text:', this.searchText);
        // Implement search logic here (debounce is recommended in production)
        this.goToPage(1); // Reset to first page
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        console.log('Navigated to page:', this.currentPage);
        // Implement logic to fetch or slice data for the new page
    }

    // --- FORM DATA AND METHODS (MOCK) ---
    paymentMethods = ['Cash', 'Mobile Money', 'Bank Transfer', 'Credit Card'];
    existingCategories: Category[] = [
        { id: 'CAT-001', name: 'Transport' },
        { id: 'CAT-002', name: 'Meals' },
        { id: 'CAT-003', name: 'Supplies' },
        { id: 'CAT-004', name: 'Travel' },
        { id: 'CAT-005', name: 'Utilities' },
    ];
    existingPayees: Payee[] = [
        { id: 'PAY-001', name: "Gas Station A" },
        { id: 'PAY-002', name: "Mama Pima Restaurant" },
        { id: 'PAY-003', name: "Office Mart" },
        { id: 'PAY-004', name: "Sunrise Lodge" },
    ];

    // Address mocks
    regions: Region[] = [
        { name: 'Dar es Salaam', districts: [{ name: 'Kinondoni', wards: [{ id: 'W1', name: 'Mbezi Beach' }] }, { name: 'Ilala', wards: [{ id: 'W2', name: 'Kariakoo' }] }] },
        { name: 'Mwanza', districts: [{ name: 'Nyamagana', wards: [{ id: 'W3', name: 'Isamilo' }] }] },
    ];
    districts: { name: string; wards: { id: string, name: string }[] }[] = [];
    wards: { id: string, name: string }[] = [];

    expenseForm!: FormGroup;
    isSubmitted = false;
    isLoading = false;

    // Custom Validator for Category/Payee conditional validation
    static conditionalRequiredValidator(control: AbstractControl): ValidationErrors | null {
        const categoryChoice = control.get('category_choice')?.value;
        const categoryId = control.get('category_id')?.value;
        const newCategoryName = control.get('new_category.name')?.value;

        // Category validation
        if (categoryChoice === 'existing' && !categoryId) {
            return { categoryMissing: true };
        }
        if (categoryChoice === 'new' && !newCategoryName) {
            // This is actually handled by the inner required validator, but included for completeness
        }

        const payeeChoice = control.get('payee_choice')?.value;
        const payeeId = control.get('payee_id')?.value;
        const newPayeeName = control.get('new_payee.payee_name')?.value;

        // Payee validation (only if choice is existing)
        if (payeeChoice === 'existing' && !payeeId) {
            return { payeeMissing: true };
        }
        // New payee name validation (only if choice is new)
        if (payeeChoice === 'new' && !newPayeeName) {
            // This is actually handled by the inner required validator, but included for completeness
        }

        // Payee address validation if required
        const hasAddress = control.get('new_payee.hasAddress')?.value;
        if (payeeChoice === 'new' && hasAddress) {
             const regionId = control.get('new_payee.address.region_id')?.value;
             if (!regionId) {
                return { addressRegionMissing: true };
             }
             // For the sake of simplicity, we only check the region for the whole group error
             // Individual field validation is still applied via the built-in Validators.
        }

        return null;
    }

    constructor() {
        this.initForm();
    }

    ngOnInit(): void {
        this.subscribeToFormChanges();
    }

    initForm(): void {
        this.expenseForm = this.fb.group({
            amount: [null, [Validators.required, Validators.min(0.01)]],
            payment_method: [null, Validators.required],
            description: ['', Validators.required],

            // Category Fields
            category_choice: ['existing', Validators.required], // 'existing' or 'new'
            category_id: [null], // For existing category
            new_category: this.fb.group({
                name: [''] // For new category name
            }),

            // Payee Fields
            payee_choice: ['none', Validators.required], // 'none', 'existing', or 'new'
            payee_id: [null], // For existing payee
            new_payee: this.fb.group({
                payee_name: [''],
                phone_number: [''],
                hasAddress: [false],
                address: this.fb.group({
                    region_id: [null],
                    district_id: [null],
                    ward_id: [null],
                })
            })
        }); // Apply custom validator to main form group

        // Initial form setup: set required validators conditionally
        this.setConditionalValidators(this.expenseForm.get('category_choice')?.value, 'category');
        this.setConditionalValidators(this.expenseForm.get('payee_choice')?.value, 'payee');
    }

    subscribeToFormChanges(): void {
        // --- Category Logic ---
        this.expenseForm.get('category_choice')?.valueChanges.subscribe(value => {
            this.setConditionalValidators(value, 'category');
            this.expenseForm.updateValueAndValidity();
        });

        // --- Payee Logic ---
        this.expenseForm.get('payee_choice')?.valueChanges.subscribe(value => {
            this.setConditionalValidators(value, 'payee');
            this.expenseForm.updateValueAndValidity();
        });

        // --- Address Logic ---
        const newPayeeControl = this.expenseForm.get('new_payee') as FormGroup;
        newPayeeControl.get('hasAddress')?.valueChanges.subscribe(hasAddress => {
            this.setAddressValidators(hasAddress);
            this.expenseForm.updateValueAndValidity();
        });

        newPayeeControl.get('address.region_id')?.valueChanges.subscribe(regionName => {
            this.districts = regionName ? this.regions.find(r => r.name === regionName)?.districts || [] : [];
            this.wards = [];
            newPayeeControl.get('address.district_id')?.setValue(null);
            newPayeeControl.get('address.ward_id')?.setValue(null);
        });

        newPayeeControl.get('address.district_id')?.valueChanges.subscribe(districtName => {
            const regionName = newPayeeControl.get('address.region_id')?.value;
            const district = this.regions.find(r => r.name === regionName)?.districts.find(d => d.name === districtName);
            this.wards = district ? district.wards : [];
            newPayeeControl.get('address.ward_id')?.setValue(null);
        });
    }

    setConditionalValidators(choice: string, type: 'category' | 'payee'): void {
        if (type === 'category') {
            const categoryIdControl = this.expenseForm.get('category_id');
            const newCategoryNameControl = this.newCategory.get('name');

            categoryIdControl?.clearValidators();
            newCategoryNameControl?.clearValidators();

            if (choice === 'existing') {
                categoryIdControl?.setValidators(Validators.required);
            } else if (choice === 'new') {
                newCategoryNameControl?.setValidators(Validators.required);
            }
            categoryIdControl?.updateValueAndValidity();
            newCategoryNameControl?.updateValueAndValidity();

        } else if (type === 'payee') {
            const payeeIdControl = this.expenseForm.get('payee_id');
            const payeeNameControl = this.newPayee.get('payee_name');

            payeeIdControl?.clearValidators();
            payeeNameControl?.clearValidators();
            this.setAddressValidators(this.newPayee.get('hasAddress')?.value);

            if (choice === 'existing') {
                payeeIdControl?.setValidators(Validators.required);
            } else if (choice === 'new') {
                payeeNameControl?.setValidators(Validators.required);
            }
            payeeIdControl?.updateValueAndValidity();
            payeeNameControl?.updateValueAndValidity();
        }
    }

    setAddressValidators(hasAddress: boolean): void {
        const regionControl = this.newPayeeAddress.get('region_id');
        const districtControl = this.newPayeeAddress.get('district_id');
        const wardControl = this.newPayeeAddress.get('ward_id');

        if (hasAddress) {
            regionControl?.setValidators(Validators.required);
            // Districts/Wards are conditionally validated via enable/disable in template
        } else {
            regionControl?.clearValidators();
            districtControl?.clearValidators();
            wardControl?.clearValidators();
        }

        regionControl?.updateValueAndValidity();
        districtControl?.updateValueAndValidity();
        wardControl?.updateValueAndValidity();
    }

    // Getters for form groups
    get newCategory(): FormGroup {
        return this.expenseForm.get('new_category') as FormGroup;
    }

    get newPayee(): FormGroup {
        return this.expenseForm.get('new_payee') as FormGroup;
    }

    get newPayeeAddress(): FormGroup {
        return this.newPayee.get('address') as FormGroup;
    }

    // --- MODAL/CONFIRMATION LOGIC ---
    showModal = signal(false);
    modalMessage = signal('');
    modalActionLabel = signal('');
    modalCallback: (() => void) | null = null;

    openModal(message: string, actionLabel: string, callback: () => void): void {
        this.modalMessage.set(message);
        this.modalActionLabel.set(actionLabel);
        this.modalCallback = callback;
        this.showModal.set(true);
    }

    closeModal(): void {
        this.showModal.set(false);
        this.modalCallback = null;
    }

    handleModalAction(): void {
        if (this.modalCallback) {
            this.modalCallback();
        }
        this.closeModal();
    }

    // --- SUBMISSION LOGIC ---
    onSubmit(): void {
        this.isSubmitted = true;
        this.expenseForm.markAllAsTouched();

        if (this.expenseForm.invalid) {
            console.error('Form is invalid. Cannot submit.', this.expenseForm.errors);
            // Use custom modal instead of alert
            this.openModal(
                'Please correct the highlighted errors in the form before submitting the expense.',
                'Acknowledge',
                () => {} // No action needed on dismiss
            );
            return;
        }

        this.openModal(
            'Are you sure you want to record this expense?',
            'Confirm Record',
            () => this.recordExpense() // Execute the actual submission logic
        );
    }

    recordExpense(): void {
        this.isLoading = true;
        const formData = this.expenseForm.value;
        console.log('Submitting expense:', formData);

        // Mock API call delay
        setTimeout(() => {
            this.isLoading = false;
            console.log('Expense recorded successfully.');
            // Reset form and flip back to view
            this.expenseForm.reset({
                category_choice: 'existing',
                payee_choice: 'none',
                new_payee: { hasAddress: false }
            });
            this.isSubmitted = false;
            this.toggleView('view');
            // Mock a successful submission toast/message
            console.log('SUCCESS: Expense recorded and view switched to table.');
        }, 1500);
    }
}
