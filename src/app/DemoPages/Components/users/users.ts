import { Component, OnInit, OnDestroy, ViewChild, ElementRef, WritableSignal, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UserGroup, UserPayload } from './data';


@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit, OnDestroy {

  // Get a reference to the modal content template in the HTML file
  @ViewChild('userFormContent') userFormContent!: ElementRef;

  userForm!: FormGroup;
  availableGroups: UserGroup[] = []; // To store groups fetched from the API
  isLoading: boolean = false;
  isSubmitted: boolean = false;
  groupsLoading: boolean = false;
  message: WritableSignal<string | null> = signal(null);

  private activeModal!: NgbModalRef; // 👈 Track the active modal instance
  private subscriptions: Subscription = new Subscription();
  private apiUrl = 'http://127.0.0.1:8000/api/auth/'; // Replace with your actual base URL

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private modalService: NgbModal // 👈 Inject NgbModal
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    // We only initialize the form here. Groups are fetched when the modal opens.
  }

  /**
   * Initializes the user creation form structure.
   */
  initializeForm(): void {
    this.userForm = this.fb.group({
      phone_number: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      groups: [[], Validators.required]
    });
  }

  // ----------------------------------------
  // MODAL CONTROL METHODS
  // ----------------------------------------

  /**
   * Opens the user creation modal and first ensures groups are loaded.
   */
  openUserModal(): void {
    this.userForm.reset({ groups: [] });
    this.isSubmitted = false;
    this.userForm.markAsPristine();
    this.userForm.markAsUntouched();

    // 1. Fetch groups if they haven't been loaded yet
    if (this.availableGroups.length === 0) {
      this.fetchUserGroups(() => {
        // 2. Open modal after groups are loaded
        this.activeModal = this.modalService.open(this.userFormContent, {
            size: 'md',
            backdrop: 'static',
            keyboard: false
        });
      });
    } else {
        // 2. Open modal immediately if groups are already loaded
        this.activeModal = this.modalService.open(this.userFormContent, {
            size: 'md',
            backdrop: 'static',
            keyboard: false
        });
    }
  }

  /**
   * Closes the active modal.
   */
  closeUserModal(): void {
    if (this.activeModal) {
      this.activeModal.close();
    }
  }

  // ----------------------------------------
  // DATA AND API LOGIC
  // ----------------------------------------

  /**
   * Fetches the list of available user groups from the API.
   * @param callback Function to execute after successful fetching.
   */
  fetchUserGroups(callback: () => void): void {
    this.groupsLoading = true;
    this.subscriptions.add(
      this.http.get<UserGroup[]>(`${this.apiUrl}groups/`).subscribe({
        next: (data) => {
          this.availableGroups = data;
          this.groupsLoading = false;
          callback();
        },
        error: (err) => {
          console.error('Failed to fetch user groups:', err);
          this.groupsLoading = false;
          // You might want to display a modal error or dismiss the modal here
        }
      })
    );
  }

  /**
   * Handles form submission to create the new user.
   */
  onSubmit(): void {
    this.isSubmitted = true;
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const payload: UserPayload = this.userForm.value;

    // Ensure group IDs are treated as numbers
    payload.groups = payload.groups.map(g => Number(g));

    this.http.post(`${this.apiUrl}register/staff/`, payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        alert('User created successfully!');
        this.closeUserModal(); // 👈 Close modal on success
      },
      error: err => {
        const errors = err?.error;
        if (errors && typeof errors === 'object') {
          // Server-side validation handling
          Object.keys(errors).forEach(field => {
            const control = this.userForm.get(field);
            this.isLoading = false;
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

  // Helper getter for easy template access
  get f() {
    return this.userForm.controls;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


}
