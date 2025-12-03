import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";


export interface Region {
  id: number;
  name: string;
}

export interface Address {
  id: number;
  region: Region;
  district: string;
  ward: string;
  street: string;
  post_code: number;
  street_prominent_name: string;
  house_number: string;
  plot_number: string;
}

export interface NextOfKin {
  id: number;
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
  physical_address: string;
}

export interface UserData {
  groups: string;
  phone_number: string;
  second_phone_number: string;
  first_name: string;
  title: string;
  birth_date: string;
  middle_name: string;
  last_name: string;
  email: string;
  last_login: string;
  address: Address;
  next_of_kin: NextOfKin[];
}


@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {

  private http = inject(HttpClient);
  private url = 'http://localhost:8000/api/auth/complete-registration';
  userData: UserData | undefined;

  currentJustify = 'start';
  currentOrientation = 'horizontal';
  disabled = true;

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.http.get<UserData>(`${this.url}`).subscribe(res => {
      this.userData = res;
      console.log(this.userData);
    });
  }

  get fullName(): string {
    if (!this.userData) return '';
    return `${this.userData.title} ${this.userData.first_name} ${this.userData.middle_name} ${this.userData.last_name}`;
  }

}
