import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeFooter } from './home-footer';

describe('HomeFooter', () => {
  let component: HomeFooter;
  let fixture: ComponentFixture<HomeFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeFooter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeFooter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
