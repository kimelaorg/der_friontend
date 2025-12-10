import { Component, OnInit } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { TopNav } from './top-nav/top-nav';

@Component({
  selector: 'app-home-layout',
  standalone: false,
  templateUrl: './home-layout.html',
  styleUrl: './home-layout.scss',
})
export class HomeLayout implements OnInit {

  title = 'Daz Electronics';

  ngOnInit(): void {
    setTimeout(() => {
      initFlowbite();
    }, 100);
  }

}
