import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CreditService } from '../../../core/services/credit.service';
import { ClientService } from '../../../core/services/client.service';
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
  private router = inject(Router);

  clients = signal<Client[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  simulationForm = this.fb.group({
    clientId: ['', [Validators.required]],
    montant: [1000000, [Validators.required, Validators.min(50000)]],
    tauxInteret: [5.5, [Validators.required, Validators.min(0.1)]],
    dureeMois: [12, [Validators.required, Validators.min(3), Validators.max(60)]]
  });

  ngOnInit(): void {
    this.clientService.getAll().subscribe({
      next: (clients) => this.clients.set(clients),
      error: () => this.errorMessage.set('Impossible de charger la liste des clients.')
    });
  }

  // Signal dérivé recalculé automatiquement à chaque frappe grâce à toSignal-like pattern manuel
  // (on relit les valeurs actuelles à chaque appel, comme une méthode)
  calculerMensualite(): number {
    const montant = Number(this.simulationForm.get('montant')?.value) || 0;
    const taux = Number(this.simulationForm.get('tauxInteret')?.value) || 0;
    const duree = Number(this.simulationForm.get('dureeMois')?.value) || 1;

    if (montant <= 0 || duree <= 0) return 0;

    const tauxMensuel = taux / 100 / 12;

    if (tauxMensuel === 0) {
      return montant / duree;
    }

    // Formule standard d'annuité constante
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
    if (this.simulationForm.invalid) {
      this.simulationForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.simulationForm.value;
    const mensualite = this.calculerMensualite();
    const duree = Number(formValue.dureeMois);

    // Génération de l'échéancier complet
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