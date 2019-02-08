import { TestBed } from '@angular/core/testing';

import { RebelService } from './rebel.service';

describe('RebelService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RebelService = TestBed.get(RebelService);
    expect(service).toBeTruthy();
  });
});
