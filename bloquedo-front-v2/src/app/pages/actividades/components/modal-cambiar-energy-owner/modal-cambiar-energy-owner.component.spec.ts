import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCambiarEnergyOwnerComponent } from './modal-cambiar-energy-owner.component';

describe('ModalCambiarEnergyOwnerComponent', () => {
  let component: ModalCambiarEnergyOwnerComponent;
  let fixture: ComponentFixture<ModalCambiarEnergyOwnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCambiarEnergyOwnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCambiarEnergyOwnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
