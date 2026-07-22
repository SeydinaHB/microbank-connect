import { Component, inject, signal, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [NgClass],
  templateUrl: './notification-bell.component.html'
})
export class NotificationBellComponent implements OnInit {
  private notificationService = inject(NotificationService);

  notifications = signal<AppNotification[]>([]);
  isOpen = signal(false);

  ngOnInit(): void {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => this.notifications.set(notifications)
    });
  }

  toggle(): void {
    // On recharge à chaque ouverture, pour avoir des données toujours à jour
    // (le composant reste vivant en permanence dans le layout, donc son ngOnInit ne se relance jamais seul)
    if (!this.isOpen()) {
      this.loadNotifications();
    }
    this.isOpen.update((value) => !value);
  }

  close(): void {
    this.isOpen.set(false);
  }
}