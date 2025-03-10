import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AreasService } from '../../../../services/areas.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-area',
  standalone: true,
  imports: [ FormsModule, ReactiveFormsModule ],
  templateUrl: './crear-area.component.html',
  styleUrl: './crear-area.component.scss'
})
export class CrearAreaComponent {
  areaForm: FormGroup;
  areas: Array<{name: string, description: string}> = [];

  constructor(private fb: FormBuilder, private areasService: AreasService, private router: Router) {
    this.areaForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit() {
    if (this.areaForm.valid) {
      this.areasService.createArea(this.areaForm.value).subscribe(response => {
        console.log(response);
        this.router.navigate(['/dashboard/areas']);
      });
    } else {
 
    }
  }
}