import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { specificIdResolver } from './specific-id-resolver';

describe('specificIdResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => specificIdResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
