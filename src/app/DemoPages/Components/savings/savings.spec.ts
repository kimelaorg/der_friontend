import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Savings } from './savings';

describe('Savings', () => {
  let component: Savings;
  let fixture: ComponentFixture<Savings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Savings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Savings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
