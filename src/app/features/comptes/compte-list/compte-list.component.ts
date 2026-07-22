import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { CompteService } from '../../../core/services/compte.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';
import { Compte } from '../../../core/models/compte.model';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-compte-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, NgClass],
  templateUrl: './compte-list.component.html'
})
export class CompteListComponent implements OnInit {
  private compteService = inject(CompteService);
  private clientService = inject(ClientService);
  private authService = inject(AuthService);

  comptes = signal<Compte[]>([]);
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Le client connecté ne doit pas pouvoir créer de compte lui-même (seul un agent/gestionnaire le peut)
  canCreateCompte = this.authService.userRole() !== 'client';

  ngOnInit(): void {
    this.isLoading.set(true);

    this.compteService.getAll().subscribe({
      next: (comptes) => {
        const role = this.authService.userRole();
        const currentUser = this.authService.currentUser();

        if (role === 'client' && currentUser?.clientId) {
          // Un client ne voit que ses propres comptes
          this.comptes.set(comptes.filter((c) => c.clientId === currentUser.clientId));
        } else {
          // Agent / Gestionnaire voient tous les comptes
          this.comptes.set(comptes);
        }

        this.loadClients();
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les comptes.');
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
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getClientName(clientId: number): string {
    const client = this.clients().find((c) => c.id === clientId);
    return client ? `${client.prenom} ${client.nom}` : 'Client inconnu';
  }
}