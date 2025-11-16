import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: false,})
export class FooterComponent implements OnInit {

  readonly currentYear: number = new Date().getFullYear();
  public Copyright: string = '';
  public brand = "Daz Electronics";

  constructor() { }

  ngOnInit(): void {
    this.get_copyright_name();
  }


  get_copyright_name(){
    this.Copyright = `${this.brand} ${this.currentYear}`;
    return this.Copyright;
  }

}
