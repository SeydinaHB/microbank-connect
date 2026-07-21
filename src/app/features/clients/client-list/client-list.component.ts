import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './client-list.component.html'
})
export class ClientListComponent implements OnInit {
  private clientService = inject(ClientService);

  clients = signal<Client[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  searchQuery = signal('');

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.clientService.getAll().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les clients. Vérifiez que json-server tourne.');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery().trim();

    if (!query) {
      this.loadClients();
      return;
    }

    this.isLoading.set(true);
    this.clientService.search(query).subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors de la recherche.');
        this.isLoading.set(false);
      }
    });
  }

  onDelete(id: number): void {
    if (!confirm('Confirmer la suppression de ce client ?')) return;

    this.clientService.delete(id).subscribe({
      next: () => this.loadClients(),
      error: () => this.errorMessage.set('Erreur lors de la suppression.')
    });
  }
}