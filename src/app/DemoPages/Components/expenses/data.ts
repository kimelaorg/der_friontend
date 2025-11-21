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
  new_category?: { category_name: string };

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
    };
  };
}


export interface AddressDataResponse {
  districts: DistrictEntity[];
  wards: WardEntity[];
}
