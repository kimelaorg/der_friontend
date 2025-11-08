import { Component } from '@angular/core';

@Component({
  selector: 'app-clients',
  standalone: false,
  templateUrl: './clients.html',
  styleUrl: './clients.scss',
})
export class Clients {

  heading = 'Analytics Dashboard';
  subheading = 'This is an example dashboard created using build-in elements and components.';
  icon = 'pe-7s-plane icon-gradient bg-tempting-azure';

}
