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
  tousLesComptes = signal<Compte[]>([]);
  tousLesClients = signal<Client[]>([]);
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
        // Nécessaire pour retrouver le numéro du compte destinataire/source dans l'historique
        this.compteService.getAll().subscribe({
          next: (comptes) => this.tousLesComptes.set(comptes)
        });
        this.clientService.getAll().subscribe({
          next: (clients) => this.tousLesClients.set(clients)
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

  getMontantSigne(transaction: Transaction): number {
    if (transaction.type === 'depot') return transaction.montant;
    if (transaction.type === 'retrait') return -transaction.montant;
    if (transaction.type === 'virement') {
      return transaction.compteId === this.compte()?.id ? -transaction.montant : transaction.montant;
    }
    return transaction.montant;
  }

  // Pour un virement : affiche "vers <numéro>" si ce compte est la source, "de <numéro>" si ce compte est le destinataire
  // Pour un virement : affiche "vers <nom du client>" si ce compte est la source, "de <nom du client>" si ce compte est le destinataire
  getDescriptionVirement(transaction: Transaction): string {
    if (transaction.type !== 'virement') return '';

    const estSource = transaction.compteId === this.compte()?.id;
    const autreCompteId = estSource ? transaction.compteDestinataireId : transaction.compteId;
    const autreCompte = this.tousLesComptes().find((c) => c.id === autreCompteId);

    if (!autreCompte) return estSource ? 'vers un compte inconnu' : "d'un compte inconnu";

    const autreClient = this.tousLesClients().find((c) => c.id === autreCompte.clientId);
    const nom = autreClient ? `${autreClient.prenom} ${autreClient.nom}` : 'un client inconnu';

    return estSource ? `vers ${nom}` : `de ${nom}`;
  }
}