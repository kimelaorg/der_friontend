import {Component, OnInit, inject } from '@angular/core';
import {ThemeOptions} from '../../../../../theme-options';
import { Auth, UserDataPayload, User } from '../../../../../DemoPages/UserPages/login-boxed/service/auth';

@Component({
  selector: 'app-user-box',
  templateUrl: './user-box.component.html',
  standalone: false,})
export class UserBoxComponent implements OnInit {

  private authService = inject(Auth);
  public userDetails: User | null = null;
  public userGroup: string = 'N/A';
  public profileImageUrl: string = 'assets/default-profile.png';
  public name: string = '';

  private toSentenceCase(text: string | null | undefined): string {
      if (!text) {
          return '';
      }
      // Trim to handle whitespace, then convert to lowercase, and capitalize the first letter.
      const trimmed = text.trim();
      if (trimmed.length === 0) {
          return '';
      }
      // Return: First letter uppercase + rest lowercase
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }


  constructor(public globals: ThemeOptions) {}

  ngOnInit() {

    this.userDetails = this.authService.getAuthenticatedUser();

    if (this.userDetails) {
      // Assuming the user has only one primary group for display
      this.userGroup = this.userDetails.groups.join(', ') || 'Standard User';
      this.name = `${this.userDetails?.first_name} ${this.userDetails?.last_name}`

      // If your user object included a 'profile_url' or 'avatar' field, you'd use it here.
      // Example: this.profileImageUrl = this.userDetails.profile_url || this.profileImageUrl;
    }

  }

  get fullName(): string {
      const user = this.userDetails;
      if (!user) {
          return 'Guest User';
      }

      // Apply capitalization to all name parts
      const firstName = this.toSentenceCase(user.first_name);
      const lastName = this.toSentenceCase(user.last_name);

      // Safely get the middle name, ensuring it's title-cased and not just an empty string
      const middleName = this.toSentenceCase(user.middle_name);

      let nameParts: string[] = [];

      // 1. Add First Name
      if (firstName) {
          nameParts.push(firstName);
      }

      // 2. Add Middle Name (only if it has content after capitalization/trimming)
      if (middleName) {
          nameParts.push(middleName);
      }

      // 3. Add Last Name
      if (lastName) {
          nameParts.push(lastName);
      }

      // Join the collected parts with a single space.
      return nameParts.join(' ');
  }


  logoff(): void {
    return this.authService.logout();
  }

}
