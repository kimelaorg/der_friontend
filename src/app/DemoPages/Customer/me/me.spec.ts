import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Me } from './me';

describe('Me', () => {
  let component: Me;
  let fixture: ComponentFixture<Me>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Me]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Me);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
