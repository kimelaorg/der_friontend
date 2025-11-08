import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Purchasing } from './purchasing';

describe('Purchasing', () => {
  let component: Purchasing;
  let fixture: ComponentFixture<Purchasing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Purchasing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Purchasing);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
