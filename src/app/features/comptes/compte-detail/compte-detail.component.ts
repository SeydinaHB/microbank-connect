import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { CompteService } from '../../../core/services/compte.service';
import { ClientService } from '../../../core/services/client.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { Compte } from '../../../core/models/compte.model';
import { Client } from '../../../core/models/client.model';
import { Transaction } from '../../../core/models/transaction.model';

@Component({
  selector: 'app-compte-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, NgClass],
  templateUrl: './compte-detail.component.html'
})
export class CompteDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private compteService = inject(CompteService);
  private clientService = inject(ClientService);
  private transactionService = inject(TransactionService);

  compte = signal<Compte | null>(null);
  client = signal<Client | null>(null);
  transactions = signal<Transaction[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage.set('Compte introuvable.');
      this.isLoading.set(false);
      return;
    }

    this.compteService.getById(id).subscribe({
      next: (compte) => {
        this.compte.set(compte);
        this.clientService.getById(compte.clientId).subscribe({
          next: (client) => this.client.set(client)
        });
        this.loadTransactions(id);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger ce compte.');
        this.isLoading.set(false);
      }
    });
  }

  private loadTransactions(compteId: number): void {
    this.transactionService.getByCompteId(compteId).subscribe({
      next: (transactions) => {
        this.transactions.set(transactions);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // Le montant peut apparaître en positif ou négatif selon la direction du flux, pour cette carte de compte précise
  getMontantSigne(transaction: Transaction): number {
    if (transaction.type === 'depot') return transaction.montant;
    if (transaction.type === 'retrait') return -transaction.montant;
    // Virement : négatif si ce compte est la source, positif si destinataire
    if (transaction.type === 'virement') {
      return transaction.compteId === this.compte()?.id ? -transaction.montant : transaction.montant;
    }
    return transaction.montant;
  }
}