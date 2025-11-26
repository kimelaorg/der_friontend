import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TCoins } from './t-coins';

describe('TCoins', () => {
  let component: TCoins;
  let fixture: ComponentFixture<TCoins>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TCoins]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TCoins);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
