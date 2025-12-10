import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rates } from './rates';

describe('Rates', () => {
  let component: Rates;
  let fixture: ComponentFixture<Rates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Rates]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
