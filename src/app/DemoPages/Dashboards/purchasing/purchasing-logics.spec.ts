import { TestBed } from '@angular/core/testing';

import { PurchasingLogics } from './purchasing-logics';

describe('PurchasingLogics', () => {
  let service: PurchasingLogics;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PurchasingLogics);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
