import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RupturaComponent } from './ruptura.component';

describe('RupturaComponent', () => {
  let component: RupturaComponent;
  let fixture: ComponentFixture<RupturaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RupturaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RupturaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
