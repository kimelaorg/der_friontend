export interface Entity {
  id: string;
  name: string;
}

// Defining specific entity types based on your application structure
// These are useful in the component/service for type safety when dealing with fetched data
export interface RegionEntity extends Entity {}
export interface DistrictEntity extends Entity {
    region_id: string;
}
export interface WardEntity extends Entity {
    district_id: string;
}


// --- Final Expense Payload Structure ---
export interface ExpensePayload {
  // 1. expense_date removed as it is now set by the server (timezone.now)
  amount: number;
  description: string;
  payment_method: string;

  // Category Association
  category_id?: number;
  new_category?: { name: string };

  // Payee Association
  payee_id?: number; // Used when selecting an existing payee
  new_payee?: { // Used when creating a new payee (Requirement 5)
    payee_name: string;
    phone_number?: string;
    address?: {
      // 2. Updated to use IDs for backend linking (Requirements 6 & 7)
      region_id: string;
      district_id?: string;
      ward_id?: string;
      post_code?: string;
    };
  };
}


export interface AddressDataResponse {
  districts: DistrictEntity[];
  wards: WardEntity[];
}

/**
 * Interfaces for the paginated expense data, matching the structure
 * typically returned by a Django REST Framework List API view.
 */

// --- 1. Address Interface ---
export interface IAddress {
    id: number;
    region: string;
    district: string;
    ward: string;
    street: string;
}

// --- 2. Payee Interface (uses Address) ---
export interface IPayee {
    id: number;
    name: string;
    phone_number: string;
    address: IAddress;
}

// --- 3. Category Interface ---
export interface ICategory {
    id: number;
    name: string;
}

// --- 4. Expense Record Interface (uses Payee and Category) ---
// NOTE: The 'amount' field is often returned as a string from DRF for Decimal fields.
// You will need to parse this string to a float/number on the client side if performing math.
export interface IExpense {
    id: number;
    expense_date: string; // ISO date string (e.g., "YYYY-MM-DD")
    amount: string;       // Decimal value returned as a string (e.g., "-7.05")
    description: string;
    payment_method: 'Cash' | 'Mobile Money' | 'Card' | string; // Use union types if options are known
    category: ICategory;
    payee: IPayee;
}

// --- 5. Top-Level Pagination Response Interface ---
export interface IExpensePaginationResponse {
    count: number;
    next: string | null;      // URL string or null if on the last page
    previous: string | null;  // URL string or null if on the first page
    results: IExpense[];
}
