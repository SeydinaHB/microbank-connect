import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ClientService } from '../../../core/services/client.service';
import { CompteService } from '../../../core/services/compte.service';
import { Client } from '../../../core/models/client.model';
import { Compte } from '../../../core/models/compte.model';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './client-detail.component.html'
})
export class ClientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private clientService = inject(ClientService);
  private compteService = inject(CompteService);

  client = signal<Client | null>(null);
  comptes = signal<Compte[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage.set('Client introuvable.');
      this.isLoading.set(false);
      return;
    }

    this.clientService.getById(id).subscribe({
      next: (client) => {
        this.client.set(client);
        this.loadComptes(id);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger ce client.');
        this.isLoading.set(false);
      }
    });
  }

  private loadComptes(clientId: number): void {
    this.compteService.getByClientId(clientId).subscribe({
      next: (comptes) => {
        this.comptes.set(comptes);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}