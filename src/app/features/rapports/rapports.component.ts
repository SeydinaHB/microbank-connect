import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { CompteService } from '../../core/services/compte.service';
import { ClientService } from '../../core/services/client.service';
import { CreditService } from '../../core/services/credit.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Compte } from '../../core/models/compte.model';
import { Client } from '../../core/models/client.model';
import { Credit } from '../../core/models/credit.model';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './rapports.component.html'
})
export class RapportsComponent implements OnInit {
  private compteService = inject(CompteService);
  private clientService = inject(ClientService);
  private creditService = inject(CreditService);
  private transactionService = inject(TransactionService);

  comptes = signal<Compte[]>([]);
  clients = signal<Client[]>([]);
  credits = signal<Credit[]>([]);
  transactions = signal<Transaction[]>([]);
  isLoading = signal(true);

  // --- Indicateurs calculés (signals dérivés basés sur les données chargées) ---

  nombreClients = computed(() => this.clients().length);

  nombreComptesActifs = computed(() => this.comptes().filter((c) => c.statut === 'actif').length);

  encoursTotal = computed(() => this.comptes().reduce((total, c) => total + c.solde, 0));

  volumeTransactionsMois = computed(() => {
    const maintenant = new Date();
    return this.transactions()
      .filter((t) => {
        const date = new Date(t.date);
        return date.getMonth() === maintenant.getMonth() && date.getFullYear() === maintenant.getFullYear();
      })
      .reduce((total, t) => total + t.montant, 0);
  });

  creditsEnAttente = computed(() => this.credits().filter((c) => c.statut === 'en_attente').length);

  creditsApprouves = computed(() => this.credits().filter((c) => c.statut === 'approuve').length);

  encoursCreditsApprouves = computed(() =>
    this.credits()
      .filter((c) => c.statut === 'approuve')
      .reduce((total, c) => total + c.montant, 0)
  );

  repartitionParType = computed(() => {
    const courant = this.comptes().filter((c) => c.type === 'courant').length;
    const epargne = this.comptes().filter((c) => c.type === 'epargne').length;
    const total = courant + epargne || 1; // évite une division par zéro si aucun compte
    return {
      courant,
      epargne,
      pourcentageCourant: Math.round((courant / total) * 100),
      pourcentageEpargne: Math.round((epargne / total) * 100)
    };
  });

  ngOnInit(): void {
    forkJoin({
      comptes: this.compteService.getAll(),
      clients: this.clientService.getAll(),
      credits: this.creditService.getAll(),
      transactions: this.transactionService.getAll()
    }).subscribe({
      next: ({ comptes, clients, credits, transactions }) => {
        this.comptes.set(comptes);
        this.clients.set(clients);
        this.credits.set(credits);
        this.transactions.set(transactions);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}