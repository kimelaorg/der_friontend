import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mega } from './mega';

describe('Mega', () => {
  let component: Mega;
  let fixture: ComponentFixture<Mega>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Mega]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mega);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
