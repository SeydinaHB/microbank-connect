import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CompteService } from '../../../core/services/compte.service';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-compte-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './compte-form.component.html'
})
export class CompteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private compteService = inject(CompteService);
  private clientService = inject(ClientService);
  private router = inject(Router);

  clients = signal<Client[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  compteForm = this.fb.group({
    clientId: ['', [Validators.required]],
    type: ['courant', [Validators.required]],
    soldeInitial: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.clientService.getAll().subscribe({
      next: (clients) => this.clients.set(clients),
      error: () => this.errorMessage.set('Impossible de charger la liste des clients.')
    });
  }

  onSubmit(): void {
    if (this.compteForm.invalid) {
      this.compteForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.compteForm.value;
    const numeroCompte = 'MB-' + Math.floor(1000 + Math.random() * 9000);

    const newCompte = {
      numeroCompte,
      clientId: Number(formValue.clientId),
      type: formValue.type as 'courant' | 'epargne',
      solde: Number(formValue.soldeInitial),
      devise: 'XOF',
      dateOuverture: new Date().toISOString().split('T')[0],
      statut: 'actif' as const
    };

    this.compteService.create(newCompte).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/comptes']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set("Erreur lors de l'ouverture du compte.");
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/comptes']);
  }
}