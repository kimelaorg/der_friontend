import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Specifications } from './specifications';

describe('Specifications', () => {
  let component: Specifications;
  let fixture: ComponentFixture<Specifications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Specifications]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Specifications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
