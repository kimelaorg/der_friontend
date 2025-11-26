import { Component, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- CONFIGURATION ---
// IMPORTANT: Replace this with your actual API base URL.
const BASE_API_URL = 'https://your-api-url.com/v1';

// --- INTERFACES ---

interface Group {
    id: number;
    name: string;
}

interface User {
    id: number;
    phone_number: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    groups: number[]; // Array of Group IDs
    is_staff: boolean;
    is_verified: boolean;
}

// Initial state for a new user
const EMPTY_USER: User = {
    id: 0,
    phone_number: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    groups: [],
    is_staff: true,
    is_verified: true,
};

// Helper for standardized headers
const getJsonHeaders = () => ({
    'Content-Type': 'application/json',
});

@Component({
    selector: 'app-root',
    standalone: false,
    // imports: [CommonModule, FormsModule],
    template: `
<!-- Include Bootstrap 5 CSS via style tag for full component styling -->
<style>
    @import url("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css");
</style>
<div class="container my-5">
    <div class="card shadow-lg border-0">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h2 class="mb-0">Staff User Management (CRUD)</h2>
            <!-- Button to open the custom modal -->
            <button class="btn btn-light" (click)="openUserModal()" [disabled]="isLoading()">
                <i class="bi bi-person-plus-fill"></i> Add New Staff
            </button>
        </div>

        <div class="card-body p-0 position-relative">
            <!-- Loading Overlay -->
            @if (isLoading()) {
                <div class="loading-overlay">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Fetching data...</p>
                </div>
            }

            @if (errorMessage()) {
                <div class="alert alert-danger m-4" role="alert">
                    API Error: {{ errorMessage() }}
                </div>
            }

            @if (users().length === 0 && !isLoading()) {
                <div class="alert alert-info m-4" role="alert">
                    No staff users found. Click "Add New Staff" to get started.
                </div>
            } @else if (users().length > 0) {
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th class="text-center">ID</th>
                                <th>Name</th>
                                <th>Phone Number</th>
                                <th class="text-center">Groups</th>
                                <th class="text-center">Status</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (user of users(); track user.id) {
                                <tr>
                                    <td class="text-center">{{ user.id }}</td>
                                    <td>
                                        <span class="fw-bold">{{ user.first_name }} {{ user.last_name }}</span>
                                        @if (user.middle_name) {
                                            <small class="text-muted d-block">{{ user.middle_name }}</small>
                                        }
                                    </td>
                                    <td>{{ user.phone_number }}</td>
                                    <td class="text-center">
                                        @if (user.groups.length > 0) {
                                            @for (groupId of user.groups; track groupId) {
                                                <span class="badge bg-secondary me-1">
                                                    {{ getGroupName(groupId) }}
                                                </span>
                                            }
                                        } @else {
                                            <span class="text-muted">None</span>
                                        }
                                    </td>
                                    <td class="text-center">
                                        <span class="badge"
                                            [class.bg-success]="user.is_verified"
                                            [class.bg-warning]="!user.is_verified">
                                            {{ user.is_verified ? 'Verified' : 'Unverified' }}
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-outline-primary me-2"
                                            (click)="editUser(user)" title="Edit User">
                                            <i class="bi bi-pencil"></i> Edit
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger"
                                            (click)="confirmDelete(user)" title="Delete User">
                                            <i class="bi bi-trash"></i> Delete
                                        </button>
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            }
        </div>

        <div class="card-footer text-muted">
            Total Staff Users: {{ users().length }}
        </div>
    </div>
</div>

<!-- Custom Bootstrap Modal for Create/Edit User -->
<div class="modal" [class.d-block]="isUserModalOpen()" tabindex="-1" role="dialog"
     (click)="closeUserModal('backdrop')" [attr.aria-hidden]="!isUserModalOpen()">
    <div class="modal-dialog modal-lg modal-dialog-centered" role="document" (click)="$event.stopPropagation()">
        <div class="modal-content">
            <div class="modal-header bg-light">
                <h5 class="modal-title">
                    {{ isEditing() ? 'Edit Staff User' : 'Add New Staff User' }}
                </h5>
                <button type="button" class="btn-close" (click)="closeUserModal('close button')" aria-label="Close"></button>
            </div>
            <!-- Using local variable userForm for form state management -->
            <form #userForm="ngForm" (ngSubmit)="saveUser(userForm.valid)">
                <div class="modal-body">
                    @if (modalErrorMessage()) {
                        <div class="alert alert-danger">{{ modalErrorMessage() }}</div>
                    }

                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="firstName" class="form-label">First Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="firstName" name="first_name"
                                [(ngModel)]="selectedUser.first_name" required>
                        </div>
                        <div class="col-md-6">
                            <label for="lastName" class="form-label">Last Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="lastName" name="last_name"
                                [(ngModel)]="selectedUser.last_name" required>
                        </div>
                        <div class="col-12">
                            <label for="middleName" class="form-label">Middle Name</label>
                            <input type="text" class="form-control" id="middleName" name="middle_name"
                                [(ngModel)]="selectedUser.middle_name">
                        </div>
                        <div class="col-12">
                            <label for="phoneNumber" class="form-label">Phone Number <span class="text-danger">*</span></label>
                            <!-- Note: Using 'text' type for simplicity; consider 'tel' and input masking in production -->
                            <input type="text" class="form-control" id="phoneNumber" name="phone_number"
                                [(ngModel)]="selectedUser.phone_number" required>
                        </div>

                        <div class="col-12">
                            <label for="groups" class="form-label">Groups (Select all that apply)</label>
                            <div class="form-control p-2 group-checkbox-container">
                                @for (group of groups(); track group.id) {
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox"
                                            [id]="'group' + group.id"
                                            [checked]="selectedUser.groups.includes(group.id)"
                                            (change)="toggleGroup(group.id)">
                                        <label class="form-check-label" [for]="'group' + group.id">{{ group.name }}</label>
                                    </div>
                                }
                            </div>
                        </div>

                        @if (isEditing()) {
                            <div class="col-md-6">
                                <div class="form-check form-switch mt-3">
                                    <input class="form-check-input" type="checkbox" id="isVerifiedSwitch"
                                        name="is_verified" [(ngModel)]="selectedUser.is_verified">
                                    <label class="form-check-label" for="isVerifiedSwitch">Account Verified</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <p class="text-muted mt-3 mb-0">ID: {{ selectedUser.id }}</p>
                            </div>
                        }
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" (click)="closeUserModal('Cancel click')" [disabled]="isLoading()">Cancel</button>
                    <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid || isLoading()">
                        @if (isLoading()) {
                            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Saving...
                        } @else {
                            <i class="bi bi-save"></i> {{ isEditing() ? 'Save Changes' : 'Create Staff' }}
                        }
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Custom Confirmation Modal for Deletion -->
<div class="modal" [class.d-block]="isConfirmModalOpen()" tabindex="-1" role="dialog"
     (click)="closeConfirmModal('backdrop')" [attr.aria-hidden]="!isConfirmModalOpen()">
    <div class="modal-dialog modal-dialog-centered" role="document" (click)="$event.stopPropagation()">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">Confirm Deletion</h5>
                <button type="button" class="btn-close btn-close-white" (click)="closeConfirmModal('Cancel click')" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                @if (userToDelete()) {
                    <p>Are you sure you want to delete staff user
                        <strong>{{ userToDelete()?.first_name }} {{ userToDelete()?.last_name }} (ID: {{ userToDelete()?.id }})</strong>?
                        This action cannot be undone.
                    </p>
                }
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeConfirmModal('Cancel click')" [disabled]="isLoading()">Cancel</button>
                <button type="button" class="btn btn-danger" (click)="deleteUser()" [disabled]="isLoading()">
                    @if (isLoading()) {
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Deleting...
                    } @else {
                        Delete
                    }
                </button>
            </div>
        </div>
    </div>
</div>

    `,
    styles: [`
:host {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    background-color: #f8f9fa;
    display: block;
}

/* Custom CSS to show the modal backdrop and the modal itself, replacing NgbModal functionality */
.modal {
    background-color: rgba(0, 0, 0, 0.5); /* Backdrop */
    display: none;
    overflow-y: auto;
}

.modal.d-block {
    display: block;
}

.container {
    max-width: 1100px;
}

.card-header {
    border-radius: 0.5rem 0.5rem 0 0 !important;
}

.table {
    --bs-table-hover-bg: #f3f5f6; /* Custom hover color for clarity */
}

.table th {
    vertical-align: middle;
    font-weight: 600;
}

.table td {
    vertical-align: middle;
}

.group-checkbox-container {
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    background-color: #fff;
    min-height: 40px;
}

/* Custom button styling for better touch target */
.btn-sm {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
}

/* Modal specific styling */
.modal-header.bg-danger {
    background-color: #dc3545 !important;
}

.btn-close-white {
    filter: invert(1) grayscale(100%) brightness(200%);
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.85);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
}
`]
})
export class Test {
    // --- STATE SIGNALS ---
    users: WritableSignal<User[]> = signal([]);
    groups: WritableSignal<Group[]> = signal([]);
    selectedUser: User = { ...EMPTY_USER }; // Object to hold data for modal form
    userToDelete: WritableSignal<User | null> = signal(null);
    isEditing: WritableSignal<boolean> = signal(false);

    // Global error message for table view (e.g., failed initial load)
    errorMessage: WritableSignal<string | null> = signal(null);
    // Error message specifically for the modal form
    modalErrorMessage: WritableSignal<string | null> = signal(null);
    // General loading state for API calls
    isLoading: WritableSignal<boolean> = signal(false);

    // Signals to control the visibility of our custom Bootstrap modals
    isUserModalOpen: WritableSignal<boolean> = signal(false);
    isConfirmModalOpen: WritableSignal<boolean> = signal(false);

    constructor() {
        // Initialize data upon component creation
        this.loadInitialData();
    }

    // --- CORE API FETCH HELPER ---

    private async apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
        this.isLoading.set(true);
        this.errorMessage.set(null); // Clear global error on new attempt
        this.modalErrorMessage.set(null); // Clear modal error on new attempt

        try {
            const response = await fetch(`${BASE_API_URL}${endpoint}`, {
                ...options,
                headers: { ...getJsonHeaders(), ...options.headers },
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API Request Failed (${response.status}): ${errorBody.message || response.statusText}`);
            }

            // Handle No Content (204) response, typically for DELETE
            if (response.status === 204) {
                return null as T;
            }

            return await response.json() as T;

        } catch (error) {
            const msg = error instanceof Error ? error.message : 'An unknown API error occurred.';
            console.error('API Error:', msg);
            // Set error based on where the error occurred
            if (this.isUserModalOpen() || this.isConfirmModalOpen()) {
                this.modalErrorMessage.set(msg);
            } else {
                this.errorMessage.set(msg);
            }
            return null;
        } finally {
            this.isLoading.set(false);
        }
    }

    // --- READ OPERATIONS (API) ---

    async loadInitialData(): Promise<void> {
        await this.loadGroups();
        await this.loadUsers();
    }

    async loadGroups(): Promise<void> {
        console.log('Fetching groups from API...');
        const groups = await this.apiFetch<Group[]>('/groups/');
        if (groups) {
            this.groups.set(groups);
        }
    }

    async loadUsers(): Promise<void> {
        console.log('Fetching users from API...');
        const users = await this.apiFetch<User[]>('/staff-users/');
        if (users) {
            this.users.set(users);
        }
    }

    getGroupName(id: number): string {
        return this.groups().find(g => g.id === id)?.name || 'Unknown Group';
    }

    // --- MODAL HANDLING ---

    openUserModal(): void {
        this.selectedUser = { ...EMPTY_USER };
        this.isEditing.set(false);
        this.modalErrorMessage.set(null);
        this.isUserModalOpen.set(true);
    }

    closeUserModal(reason: string): void {
        this.isUserModalOpen.set(false);
        this.modalErrorMessage.set(null);
        console.log(`User Modal dismissed: ${reason}`);
    }

    closeConfirmModal(reason: string): void {
        this.isConfirmModalOpen.set(false);
        this.userToDelete.set(null);
        this.modalErrorMessage.set(null);
        console.log(`Confirm Modal dismissed: ${reason}`);
    }

    // --- CREATE & UPDATE OPERATIONS (API) ---

    editUser(user: User): void {
        // Deep clone the user object for editing
        this.selectedUser = JSON.parse(JSON.stringify(user));
        this.isEditing.set(true);
        this.modalErrorMessage.set(null);
        this.isUserModalOpen.set(true);
    }

    toggleGroup(groupId: number): void {
        const index = this.selectedUser.groups.indexOf(groupId);
        if (index > -1) {
            this.selectedUser.groups = this.selectedUser.groups.filter(id => id !== groupId); // Remove
        } else {
            this.selectedUser.groups = [...this.selectedUser.groups, groupId]; // Add
        }
    }

    async saveUser(isValid: boolean): Promise<void> {
        if (!isValid) {
            this.modalErrorMessage.set('Please fill out all required fields.');
            return;
        }

        const userPayload = { ...this.selectedUser };

        let result: User | null = null;

        if (this.isEditing()) {
            // Update Logic (PUT/PATCH)
            console.log(`Updating user ID ${userPayload.id}...`);
            result = await this.apiFetch<User>(`/staff-users/${userPayload.id}/`, {
                method: 'PUT',
                body: JSON.stringify(userPayload)
            });
        } else {
            // Create Logic (POST)
            console.log('Creating new user...');
            // Note: Remove 'id' as the API generates it
            delete userPayload.id;
            result = await this.apiFetch<User>('/staff-users/', {
                method: 'POST',
                body: JSON.stringify(userPayload)
            });
        }

        if (result) {
            this.closeUserModal('Save success');
            // Re-fetch all users to get the guaranteed current state
            await this.loadUsers();
        }
    }

    // --- DELETE OPERATION (API) ---

    confirmDelete(user: User): void {
        this.userToDelete.set(user);
        this.isConfirmModalOpen.set(true);
    }

    async deleteUser(): Promise<void> {
        const user = this.userToDelete();
        if (!user) return;

        console.log(`Deleting user ID: ${user.id}...`);

        const result = await this.apiFetch<null>(`/staff-users/${user.id}/`, {
            method: 'DELETE',
        });

        if (result === null) {
            this.closeConfirmModal('Delete success');
            // Remove locally and clear global error if successful
            this.users.update(users => users.filter(u => u.id !== user.id));
            this.errorMessage.set(null);
            console.log('User deleted successfully.');
        } else {
             // Error already set by apiFetch
             // Keep modal open to show the error
        }
    }
}
