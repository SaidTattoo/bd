import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnergiaCeroComponent } from './energia-cero.component';

describe('EnergiaCeroComponent', () => {
  let component: EnergiaCeroComponent;
  let fixture: ComponentFixture<EnergiaCeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnergiaCeroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnergiaCeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
