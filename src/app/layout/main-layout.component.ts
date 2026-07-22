import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationBellComponent } from '../shared/components/notification-bell/notification-bell.component';
interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  authService = inject(AuthService);

  private allNavItems: Record<string, NavItem[]> = {
    client: [
      { label: 'Tableau de bord', path: '/dashboard', icon: '📊' },
      { label: 'Mes comptes', path: '/comptes', icon: '💳' },
      { label: 'Mes crédits', path: '/credits', icon: '💰' }
    ],
    agent: [
      { label: 'Tableau de bord', path: '/dashboard', icon: '📊' },
      { label: 'Clients', path: '/clients', icon: '👥' },
      { label: 'Comptes', path: '/comptes', icon: '💳' },
      { label: 'Opérations', path: '/operations', icon: '🔁' },
      { label: 'Crédits', path: '/credits', icon: '💰' }
    ],
    gestionnaire: [
      { label: 'Tableau de bord', path: '/dashboard', icon: '📊' },
      { label: 'Clients', path: '/clients', icon: '👥' },
      { label: 'Comptes', path: '/comptes', icon: '💳' },
      { label: 'Opérations', path: '/operations', icon: '🔁' },
      { label: 'Crédits', path: '/credits', icon: '💰' },
      { label: 'Rapports', path: '/rapports', icon: '📈' }
    ]
  };

  // Signal dérivé : la liste des liens change automatiquement si le rôle change
  navItems = computed<NavItem[]>(() => {
    const role = this.authService.userRole();
    return role ? this.allNavItems[role] : [];
  });
}