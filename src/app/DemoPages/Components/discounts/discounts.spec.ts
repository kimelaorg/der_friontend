import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Discounts } from './discounts';

describe('Discounts', () => {
  let component: Discounts;
  let fixture: ComponentFixture<Discounts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Discounts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Discounts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
