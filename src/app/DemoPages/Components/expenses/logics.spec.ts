import { TestBed } from '@angular/core/testing';

import { Logics } from './logics';

describe('Logics', () => {
  let service: Logics;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Logics);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
