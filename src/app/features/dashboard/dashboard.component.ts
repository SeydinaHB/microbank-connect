import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="bg-white rounded-2xl shadow p-6 max-w-2xl mx-auto">
        <h1 class="text-2xl font-bold text-blue-700 mb-2">Tableau de bord</h1>
        <p class="text-gray-600">
          Bienvenue {{ authService.currentUser()?.prenom }} {{ authService.currentUser()?.nom }}
          — rôle : <span class="font-semibold">{{ authService.userRole() }}</span>
        </p>
        <button
          (click)="authService.logout()"
          class="mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  `
})
export class DashboardComponent {
  authService = inject(AuthService);
}