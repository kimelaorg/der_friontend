import { Component } from '@angular/core';


@Component({
  selector: 'app-sales-view',
  standalone: false,
  templateUrl: './sales-view.html',
  styleUrl: './sales-view.scss',
})
export class SalesView {

  heading = 'Sales Data';
  subheading = 'View Sales Details';
  icon = 'pe-7s-cash text-success';

}
