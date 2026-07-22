import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { CompteService } from '../../../core/services/compte.service';
import { ClientService } from '../../../core/services/client.service';
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

  comptes = signal<Compte[]>([]);
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.isLoading.set(true);

    // On charge comptes ET clients en parallèle, pour afficher le nom du client sur chaque compte
    this.compteService.getAll().subscribe({
      next: (comptes) => {
        this.comptes.set(comptes);
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

  // Utilisé dans le template pour afficher le nom du client à partir de son ID
  getClientName(clientId: number): string {
    const client = this.clients().find((c) => c.id === clientId);
    return client ? `${client.prenom} ${client.nom}` : 'Client inconnu';
  }
}