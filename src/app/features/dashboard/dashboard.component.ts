import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CompteService } from '../../core/services/compte.service';
import { CreditService } from '../../core/services/credit.service';
import { ClientService } from '../../core/services/client.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Compte } from '../../core/models/compte.model';
import { Credit } from '../../core/models/credit.model';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, NgClass],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private compteService = inject(CompteService);
  private creditService = inject(CreditService);
  private clientService = inject(ClientService);
  private transactionService = inject(TransactionService);

  isLoading = signal(true);
  isClientRole = this.authService.userRole() === 'client';

  // Données Client
  mesComptes = signal<Compte[]>([]);
  mesCredits = signal<Credit[]>([]);
  mesTransactions = signal<Transaction[]>([]);

  soldeTotal = computed(() => this.mesComptes().reduce((total, c) => total + c.solde, 0));

  // Données Agent / Gestionnaire
  nombreClients = signal(0);
  nombreComptesActifs = signal(0);
  creditsEnAttente = signal(0);
  encoursTotal = signal(0);

  ngOnInit(): void {
    if (this.isClientRole) {
      this.loadClientDashboard();
    } else {
      this.loadStaffDashboard();
    }
  }

  private loadClientDashboard(): void {
    const clientId = this.authService.currentUser()?.clientId;
    if (!clientId) {
      this.isLoading.set(false);
      return;
    }

    forkJoin({
      comptes: this.compteService.getAll(),
      credits: this.creditService.getByClientId(clientId),
      transactions: this.transactionService.getAll()
    }).subscribe({
      next: ({ comptes, credits, transactions }) => {
        const mesComptesFiltres = comptes.filter((c) => c.clientId === clientId);
        this.mesComptes.set(mesComptesFiltres);
        this.mesCredits.set(credits);

        const mesComptesIds = mesComptesFiltres.map((c) => c.id);
        this.mesTransactions.set(
          transactions.filter((t) => mesComptesIds.includes(t.compteId)).slice(0, 5)
        );

        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private loadStaffDashboard(): void {
    forkJoin({
      comptes: this.compteService.getAll(),
      clients: this.clientService.getAll(),
      credits: this.creditService.getAll()
    }).subscribe({
      next: ({ comptes, clients, credits }) => {
        this.nombreClients.set(clients.length);
        this.nombreComptesActifs.set(comptes.filter((c) => c.statut === 'actif').length);
        this.creditsEnAttente.set(credits.filter((c) => c.statut === 'en_attente').length);
        this.encoursTotal.set(comptes.reduce((total, c) => total + c.solde, 0));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}