import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Software } from './software';

describe('Software', () => {
  let component: Software;
  let fixture: ComponentFixture<Software>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Software]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Software);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
