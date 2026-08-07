import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Validateur : les deux mots de passe saisis doivent être identiques
  private motsDePasseIdentiquesValidator = (group: AbstractControl): ValidationErrors | null => {
    const motDePasse = group.get('nouveauMotDePasse')?.value;
    const confirmation = group.get('confirmation')?.value;
    return motDePasse === confirmation ? null : { motsDePasseDifferents: true };
  };

  changePasswordForm = this.fb.group(
    {
      nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', [Validators.required]]
    },
    { validators: this.motsDePasseIdentiquesValidator }
  );

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const nouveauMotDePasse = this.changePasswordForm.value.nouveauMotDePasse!;

    this.authService.changePassword(nouveauMotDePasse).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Erreur lors du changement de mot de passe.');
      }
    });
  }
}