import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Proof } from './proof';

describe('Proof', () => {
  let component: Proof;
  let fixture: ComponentFixture<Proof>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Proof]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Proof);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
