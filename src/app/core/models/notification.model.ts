export type TypeNotification = 'operation' | 'credit_approuve' | 'credit_refuse' | 'credit_demande';

export interface AppNotificationRecord {
  id: number;
  clientId: number;    // le client concerné par cette notification
  type: TypeNotification;
  message: string;
  date: string;         // format ISO, avec heure (ex: 2026-07-22T14:35:00)
  lue: boolean;
}