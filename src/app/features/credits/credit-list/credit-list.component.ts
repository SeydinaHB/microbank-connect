import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { CreditService } from '../../../core/services/credit.service';
import { ClientService } from '../../../core/services/client.service';
import { Credit } from '../../../core/models/credit.model';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-credit-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, NgClass],
  templateUrl: './credit-list.component.html'
})
export class CreditListComponent implements OnInit {
  private creditService = inject(CreditService);
  private clientService = inject(ClientService);

  credits = signal<Credit[]>([]);
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.creditService.getAll().subscribe({
      next: (credits) => {
        this.credits.set(credits);
        this.loadClients();
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les crédits.');
        this.isLoading.set(false);
      }
    });
  }

  private loadClients(): void {
    this.clientService.getAll().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getClientName(clientId: number): string {
    const client = this.clients().find((c) => c.id === clientId);
    return client ? `${client.prenom} ${client.nom}` : 'Client inconnu';
  }

  approuver(credit: Credit): void {
    this.creditService.update(credit.id, { statut: 'approuve' }).subscribe({
      next: () => this.ngOnInit(),
      error: () => this.errorMessage.set("Erreur lors de l'approbation.")
    });
  }

  refuser(credit: Credit): void {
    this.creditService.update(credit.id, { statut: 'refuse' }).subscribe({
      next: () => this.ngOnInit(),
      error: () => this.errorMessage.set('Erreur lors du refus.')
    });
  }
}