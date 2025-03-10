import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCuestionarioValidacionEnergiaCeroComponent } from './modal-cuestionario-validacion-energia-cero.component';

describe('ModalCuestionarioValidacionEnergiaCeroComponent', () => {
  let component: ModalCuestionarioValidacionEnergiaCeroComponent;
  let fixture: ComponentFixture<ModalCuestionarioValidacionEnergiaCeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCuestionarioValidacionEnergiaCeroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCuestionarioValidacionEnergiaCeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
