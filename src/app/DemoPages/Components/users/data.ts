export interface UserGroup {
  id: number;
  name: string; // Assuming groups have a name
}

export interface UserPayload {
  phone_number: string;
  groups: number[];
}
