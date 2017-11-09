/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { RebelService } from './rebel.service';

describe('RebelService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RebelService]
    });
  });

  it('should ...', inject([RebelService], (service: RebelService) => {
    expect(service).toBeTruthy();
  }));
});
