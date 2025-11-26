import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchSpecific } from './search-specific';

describe('SearchSpecific', () => {
  let component: SearchSpecific;
  let fixture: ComponentFixture<SearchSpecific>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchSpecific]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchSpecific);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
