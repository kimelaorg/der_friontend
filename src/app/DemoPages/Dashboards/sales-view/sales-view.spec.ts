import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesView } from './sales-view';

describe('SalesView', () => {
  let component: SalesView;
  let fixture: ComponentFixture<SalesView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SalesView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
