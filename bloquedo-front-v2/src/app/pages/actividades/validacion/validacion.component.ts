import { CommonModule } from '@angular/common';
import { Component, Output,EventEmitter, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from 'express';
import { UsersService } from '../../services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-validacion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './validacion.component.html',
  styleUrl: './validacion.component.scss'
})
export class ValidacionComponent {
  constructor(  public dialogRef: MatDialogRef<ValidacionComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private usersService: UsersService) {}
  isFingerprintLoading = false; // Controla el estado de carga
  showCredentialsForm = false;
  showVerificationCode = false;
  showFingerprint = false;
  perfil: any;
  username = '';
  password = '';
  verificationDigits: string[] = new Array(6).fill('');
  fingerprintAttempts = 0;
  maxFingerprintAttempts = 3;

  selectLoginMethod(method: 'credentials' | 'fingerprint') {
    if (method === 'credentials') {
      this.showCredentialsForm = true;
      this.showFingerprint = false;
    } else {
      this.showFingerprint = true;
      this.showCredentialsForm = false;
      this.capturarYCompararHuella();
    }
  }

  submitCredentials() {
    if (this.username && this.password) {
      // Simulate API validation
      console.log(this.username, this.password);
      this.usersService.loginByEmailandPassword(this.username, this.password).subscribe( {
        next: (response:any) => {
          console.log('response',response);
          this.perfil = response.perfil;
          this.dialogRef.close({
          username: this.username,
          perfil: this.perfil,
          user:response,
          loginMethod: 'credentials',
          verificationStatus: 'verified'
        } as any);
          },
        error: (error) => {
         Swal.fire({
          title: 'Error',
          text: 'Usuario o contraseña incorrectos',
          icon: 'error',
          confirmButtonColor: '#3085d6'
            
         });
        }
      });
      /* setTimeout(() => {
        this.showCredentialsForm = false;
        this.showVerificationCode = true;
      }, 1000); */
    }
  }

  onDigitInput(event: any, index: number) {
    const value = event.target.value;
    if (value.length === 1 && index < 5) {
      const nextInput = event.target.nextElementSibling;
      if (nextInput) nextInput.focus();
    }
  }

  verifyCode() {
    const code = this.verificationDigits.join('');
    if (code.length === 6) {
      // Implement verification logic
      this.dialogRef.close({
        verificationStatus: 'verified'
      });
    }
  }

  capturarYCompararHuella() {
    if (this.fingerprintAttempts >= this.maxFingerprintAttempts) {
      Swal.fire({
        title: 'Límite de intentos alcanzado',
        text: 'Por favor, utilice el método de usuario y contraseña',
        icon: 'warning',
        confirmButtonColor: '#3085d6'
      });
      this.showFingerprint = false;
      this.showCredentialsForm = true;
      return;
    }

    this.isFingerprintLoading = true;

    this.usersService.captureFingerprint().subscribe({
      next: (response: any) => {
        if (response.error === false) {
          this.usersService.compareFingerprint(response.template, this.fingerprintAttempts).subscribe({
            next: (comparisonResponse: any) => {
              this.isFingerprintLoading = false;
              if (comparisonResponse.error === false) {
                this.dialogRef.close({
                  user: comparisonResponse.user,
                  loginMethod: 'fingerprint',
                  verificationStatus: 'verified'
                });
              } else {
                this.fingerprintAttempts++;
                const remainingAttempts = this.maxFingerprintAttempts - this.fingerprintAttempts;
                
                Swal.fire({
                  title: 'Error de autenticación',
                  text: `Huella no reconocida. Intentos restantes: ${remainingAttempts}`,
                  icon: 'error',
                  confirmButtonColor: '#3085d6'
                }).then(() => {
                  if (this.fingerprintAttempts < this.maxFingerprintAttempts) {
                    this.capturarYCompararHuella();
                  } else {
                    this.showFingerprint = false;
                    this.showCredentialsForm = true;
                  }
                });
              }
            },
            error: (error) => {
              this.isFingerprintLoading = false;
              this.fingerprintAttempts++;
              const remainingAttempts = this.maxFingerprintAttempts - this.fingerprintAttempts;
              
              Swal.fire({
                title: 'Error',
                text: `Error al comparar la huella. Intentos restantes: ${remainingAttempts}`,
                icon: 'error',
                confirmButtonColor: '#3085d6'
              }).then(() => {
                if (this.fingerprintAttempts < this.maxFingerprintAttempts) {
                  this.capturarYCompararHuella();
                } else {
                  this.showFingerprint = false;
                  this.showCredentialsForm = true;
                }
              });
            }
          });
        } else {
          this.isFingerprintLoading = false;
          this.fingerprintAttempts++;
          const remainingAttempts = this.maxFingerprintAttempts - this.fingerprintAttempts;
          
          Swal.fire({
            title: 'Error',
            text: `Error al capturar la huella. Intentos restantes: ${remainingAttempts}`,
            icon: 'error',
            confirmButtonColor: '#3085d6'
          }).then(() => {
            if (this.fingerprintAttempts < this.maxFingerprintAttempts) {
              this.capturarYCompararHuella();
            } else {
              this.showFingerprint = false;
              this.showCredentialsForm = true;
            }
          });
        }
      },
      error: (error) => {
        this.isFingerprintLoading = false;
        this.fingerprintAttempts++;
        const remainingAttempts = this.maxFingerprintAttempts - this.fingerprintAttempts;
        
        Swal.fire({
          title: 'Error',
          text: `Error en el dispositivo. Intentos restantes: ${remainingAttempts}`,
          icon: 'error',
          confirmButtonColor: '#3085d6'
        }).then(() => {
          if (this.fingerprintAttempts < this.maxFingerprintAttempts) {
            this.capturarYCompararHuella();
          } else {
            this.showFingerprint = false;
            this.showCredentialsForm = true;
          }
        });
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}