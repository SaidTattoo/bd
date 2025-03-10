import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationDataService {

  private validationData: any = {};

  setValidationData(data: any) {
    this.validationData = data;
  }

  getValidationData() {
    return this.validationData;
  }

  clearValidationData() {
    this.validationData = {};
  }
}
