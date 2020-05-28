import { TestBed } from '@angular/core/testing';

import { MpdService } from './mpd.service';

describe('MpdService', () => {
  let service: MpdService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MpdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
