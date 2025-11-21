import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Purchased } from './purchased';

describe('Purchased', () => {
  let component: Purchased;
  let fixture: ComponentFixture<Purchased>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Purchased]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Purchased);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
