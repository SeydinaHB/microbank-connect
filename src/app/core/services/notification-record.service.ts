import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppNotificationRecord, TypeNotification } from '../models/notification.model';

const API_URL = 'http://localhost:3001';

@Injectable({ providedIn: 'root' })
export class NotificationRecordService {
  private http = inject(HttpClient);

  getByClientId(clientId: number): Observable<AppNotificationRecord[]> {
    return this.http.get<AppNotificationRecord[]>(
      `${API_URL}/notifications?clientId=${clientId}&_sort=date&_order=desc`
    );
  }

  // Crée une notification d'activité pour un client — appelée depuis Opérations et Crédits
  creer(clientId: number, type: TypeNotification, message: string): Observable<AppNotificationRecord> {
    const notification: Omit<AppNotificationRecord, 'id'> = {
      clientId,
      type,
      message,
      date: new Date().toISOString(),
      lue: false
    };
    return this.http.post<AppNotificationRecord>(`${API_URL}/notifications`, notification);
  }
}