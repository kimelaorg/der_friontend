import { Component } from '@angular/core';

@Component({
  selector: 'app-home-footer',
  standalone: false,
  templateUrl: './home-footer.html',
  styleUrl: './home-footer.scss',
})
export class HomeFooter {

  currentYear: number = new Date().getFullYear();

}
