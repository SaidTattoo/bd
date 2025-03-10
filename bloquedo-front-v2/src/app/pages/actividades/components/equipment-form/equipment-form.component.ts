import { Component, EventEmitter, Output } from '@angular/core';
import { Equipment } from '../../interface/activity.interface';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AreasService } from '../../../services/areas.service';
import { EquiposService } from '../../../services/equipos.service';

@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './equipment-form.component.html',
  styleUrl: './equipment-form.component.scss'
})
export class EquipmentFormComponent {
  @Output() onSubmit = new EventEmitter<Equipment>();
  @Output() onCancel = new EventEmitter<void>();

  equipmentForm: FormGroup;
  areas: any[] = [];
  constructor(private fb: FormBuilder, private areaService: AreasService, private equiposService: EquiposService) {
    this.areaService.getAreas().subscribe(areas => {
      this.areas = areas;
    });
    this.equipmentForm = this.fb.group({
      name: ['', Validators.required],  
      description: ['',Validators.required],
      area: ['',Validators.required],
    });
  }

  submit() {
    if (this.equipmentForm.valid) {
      const equipment: Equipment = {
        ...this.equipmentForm.value
      };
      console.log(equipment);
      this.equiposService.createEquipment(equipment).subscribe((res:any) => {
        this.onSubmit.emit(res.equipo);
      });
    }
  }
}