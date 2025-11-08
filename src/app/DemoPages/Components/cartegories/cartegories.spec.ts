import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cartegories } from './cartegories';

describe('Cartegories', () => {
  let component: Cartegories;
  let fixture: ComponentFixture<Cartegories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Cartegories]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cartegories);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
