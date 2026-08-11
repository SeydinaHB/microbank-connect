import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profil.component.html'
})
export class ProfilComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Validateur : l'ancien mot de passe saisi doit correspondre à celui actuellement enregistré
  private ancienMotDePasseValidator = (control: AbstractControl): ValidationErrors | null => {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return null;
    return control.value === currentUser.password ? null : { ancienIncorrect: true };
  };

  // Validateur de groupe : les deux nouveaux mots de passe doivent être identiques
  private motsDePasseIdentiquesValidator = (group: AbstractControl): ValidationErrors | null => {
    const nouveau = group.get('nouveauMotDePasse')?.value;
    const confirmation = group.get('confirmation')?.value;
    return nouveau === confirmation ? null : { motsDePasseDifferents: true };
  };

  profilForm = this.fb.group(
    {
      ancienMotDePasse: ['', [Validators.required, this.ancienMotDePasseValidator]],
      nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', [Validators.required]]
    },
    { validators: this.motsDePasseIdentiquesValidator }
  );

  onSubmit(): void {
    if (this.profilForm.invalid) {
      this.profilForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const nouveauMotDePasse = this.profilForm.value.nouveauMotDePasse!;

    this.authService.changePassword(nouveauMotDePasse).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Mot de passe changé avec succès !');
        this.profilForm.reset();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Erreur lors du changement de mot de passe.');
      }
    });
  }
}