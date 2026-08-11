import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { CreditService } from '../../../core/services/credit.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';
import { Credit } from '../../../core/models/credit.model';
import { Client } from '../../../core/models/client.model';
import { NotificationRecordService } from '../../../core/services/notification-record.service';
@Component({
  selector: 'app-credit-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, NgClass],
  templateUrl: './credit-list.component.html'
})
export class CreditListComponent implements OnInit {
  private creditService = inject(CreditService);
  private clientService = inject(ClientService);
  private authService = inject(AuthService);
  private notificationRecordService = inject(NotificationRecordService);
  credits = signal<Credit[]>([]);
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

canRequestCredit = this.authService.userRole() === 'agent';
canApproveCredit = this.authService.userRole() === 'gestionnaire';
  ngOnInit(): void {
    this.isLoading.set(true);

    this.creditService.getAll().subscribe({
      next: (credits) => {
        const role = this.authService.userRole();
        const currentUser = this.authService.currentUser();

        if (role === 'client' && currentUser?.clientId) {
          this.credits.set(credits.filter((c) => c.clientId === currentUser.clientId));
        } else {
          this.credits.set(credits);
        }

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
      next: () => {
        this.notificationRecordService.creer(
          credit.clientId, 'credit_approuve',
          `Votre demande de crédit de ${credit.montant.toLocaleString('fr-FR')} XOF a été approuvée.`
        ).subscribe();
        this.ngOnInit();
      },
      error: () => this.errorMessage.set("Erreur lors de l'approbation.")
    });
  }

  refuser(credit: Credit): void {
    this.creditService.update(credit.id, { statut: 'refuse' }).subscribe({
      next: () => {
        this.notificationRecordService.creer(
          credit.clientId, 'credit_refuse',
          `Votre demande de crédit de ${credit.montant.toLocaleString('fr-FR')} XOF a été refusée.`
        ).subscribe();
        this.ngOnInit();
      },
      error: () => this.errorMessage.set('Erreur lors du refus.')
    });
  }
}