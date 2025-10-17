import { TestBed } from '@angular/core/testing';

import { Assemblyai } from './assemblyai';

describe('Assemblyai', () => {
  let service: Assemblyai;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Assemblyai);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
