import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './client-form.component.html'
})
export class ClientFormComponent {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  clientForm = this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required, Validators.pattern(/^7[0-9]{8}$/)]],
    adresse: ['', [Validators.required]],
    dateNaissance: ['', [Validators.required]],
    numeroCni: ['', [Validators.required, Validators.minLength(10)]]
  });

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.clientForm.value;
    const newClient = {
      nom: formValue.nom!,
      prenom: formValue.prenom!,
      email: formValue.email!,
      telephone: formValue.telephone!,
      adresse: formValue.adresse!,
      dateNaissance: formValue.dateNaissance!,
      numeroCni: formValue.numeroCni!,
      dateCreation: new Date().toISOString().split('T')[0]
    };

    this.clientService.create(newClient).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/clients']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Erreur lors de la création du client.');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/clients']);
  }
}