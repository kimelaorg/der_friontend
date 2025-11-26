import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Screens } from './screens';

describe('Screens', () => {
  let component: Screens;
  let fixture: ComponentFixture<Screens>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Screens]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Screens);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
