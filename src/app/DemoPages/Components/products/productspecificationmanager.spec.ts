import { TestBed } from '@angular/core/testing';

import { Productspecificationmanager } from './productspecificationmanager';

describe('Productspecificationmanager', () => {
  let service: Productspecificationmanager;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Productspecificationmanager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
