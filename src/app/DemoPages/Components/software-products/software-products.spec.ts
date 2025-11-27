import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoftwareProducts } from './software-products';

describe('SoftwareProducts', () => {
  let component: SoftwareProducts;
  let fixture: ComponentFixture<SoftwareProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SoftwareProducts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoftwareProducts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
