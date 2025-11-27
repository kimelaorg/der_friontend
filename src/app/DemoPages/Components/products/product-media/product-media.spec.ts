import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductMedia } from './product-media';

describe('ProductMedia', () => {
  let component: ProductMedia;
  let fixture: ComponentFixture<ProductMedia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductMedia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductMedia);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
