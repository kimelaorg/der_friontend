import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { authenticityGuard } from './authenticity-guard';

describe('authenticityGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authenticityGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
