import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CreditService } from '../../../core/services/credit.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';
import { Client } from '../../../core/models/client.model';
import { Echeance } from '../../../core/models/credit.model';

@Component({
  selector: 'app-credit-simulation',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './credit-simulation.component.html'
})
export class CreditSimulationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private creditService = inject(CreditService);
  private clientService = inject(ClientService);
  private authService = inject(AuthService);
  private router = inject(Router);

  clients = signal<Client[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Un client fait forcément une demande pour lui-même : pas de choix, pas de menu déroulant
  isClientRole = this.authService.userRole() === 'client';

  simulationForm = this.fb.group({
    clientId: ['', [Validators.required]],
    montant: [1000000, [Validators.required, Validators.min(50000)]],
    tauxInteret: [5.5, [Validators.required, Validators.min(0.1)]],
    dureeMois: [12, [Validators.required, Validators.min(3), Validators.max(60)]]
  });

  ngOnInit(): void {
    if (this.isClientRole) {
      // On pré-remplit et verrouille le clientId sur le client connecté, impossible à changer
      const clientId = this.authService.currentUser()?.clientId;
      this.simulationForm.patchValue({ clientId: String(clientId) });
      this.simulationForm.get('clientId')?.disable();
    } else {
      // Agent/Gestionnaire : on charge la liste complète pour qu'ils choisissent le client concerné
      this.clientService.getAll().subscribe({
        next: (clients) => this.clients.set(clients),
        error: () => this.errorMessage.set('Impossible de charger la liste des clients.')
      });
    }
  }

  calculerMensualite(): number {
    const montant = Number(this.simulationForm.get('montant')?.value) || 0;
    const taux = Number(this.simulationForm.get('tauxInteret')?.value) || 0;
    const duree = Number(this.simulationForm.get('dureeMois')?.value) || 1;

    if (montant <= 0 || duree <= 0) return 0;

    const tauxMensuel = taux / 100 / 12;

    if (tauxMensuel === 0) {
      return montant / duree;
    }

    const mensualite = (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -duree));
    return Math.round(mensualite);
  }

  coutTotal(): number {
    return this.calculerMensualite() * (Number(this.simulationForm.get('dureeMois')?.value) || 0);
  }

  coutInterets(): number {
    return this.coutTotal() - (Number(this.simulationForm.get('montant')?.value) || 0);
  }

  onSubmit(): void {
    // getRawValue() récupère aussi la valeur des champs désactivés (disable()), contrairement à .value
    if (this.simulationForm.invalid) {
      this.simulationForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.simulationForm.getRawValue();
    const mensualite = this.calculerMensualite();
    const duree = Number(formValue.dureeMois);

    const echeancier: Echeance[] = [];
    const dateDepart = new Date();

    for (let i = 1; i <= duree; i++) {
      const dateEcheance = new Date(dateDepart);
      dateEcheance.setMonth(dateEcheance.getMonth() + i);

      echeancier.push({
        numero: i,
        dateEcheance: dateEcheance.toISOString().split('T')[0],
        montant: mensualite,
        payee: false
      });
    }

    const newCredit = {
      clientId: Number(formValue.clientId),
      montant: Number(formValue.montant),
      tauxInteret: Number(formValue.tauxInteret),
      dureeMois: duree,
      mensualite,
      dateDemande: new Date().toISOString().split('T')[0],
      statut: 'en_attente' as const,
      echeancier
    };

    this.creditService.create(newCredit).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/credits']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Erreur lors de la demande de crédit.');
      }
    });
  }
}