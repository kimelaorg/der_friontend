import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Accessories } from './accessories';

describe('Accessories', () => {
  let component: Accessories;
  let fixture: ComponentFixture<Accessories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Accessories]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Accessories);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
