import { TestBed } from '@angular/core/testing';

import { Control } from './control';

describe('Control', () => {
  let service: Control;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Control);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
