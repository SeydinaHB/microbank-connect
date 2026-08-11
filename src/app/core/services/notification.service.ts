import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { CompteService } from './compte.service';
import { CreditService } from './credit.service';
import { AuthService } from './auth.service';
import { NotificationRecordService } from './notification-record.service';

export interface AppNotification {
  id: string;
  type: 'solde_bas' | 'echeance_proche' | 'echeance_depassee' | 'operation' | 'credit_approuve' | 'credit_refuse' | 'credit_demande';
  message: string;
  niveau: 'info' | 'warning' | 'danger';
}

const SEUIL_SOLDE_BAS = 20000; // XOF
const JOURS_ALERTE_ECHEANCE = 7;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private compteService = inject(CompteService);
  private creditService = inject(CreditService);
  private authService = inject(AuthService);
  private notificationRecordService = inject(NotificationRecordService);

  getNotifications(): Observable<AppNotification[]> {
    const role = this.authService.userRole();
    const currentUser = this.authService.currentUser();

    // Les notifications d'activité persistées ne concernent que le Client (pas Agent/Gestionnaire)
    const notificationsPersistees$ =
      role === 'client' && currentUser?.clientId
        ? this.notificationRecordService.getByClientId(currentUser.clientId)
        : of([]);

    return forkJoin({
      comptes: this.compteService.getAll(),
      credits: this.creditService.getAll(),
      notificationsPersistees: notificationsPersistees$
    }).pipe(
      map(({ comptes, credits, notificationsPersistees }) => {
        const notifications: AppNotification[] = [];

        // Notifications d'activité persistées (dépôt, retrait, virement, crédit approuvé/refusé/demandé)
        for (const n of notificationsPersistees) {
          notifications.push({
            id: `activite-${n.id}`,
            type: n.type as AppNotification['type'],
            message: n.message,
            niveau: n.type === 'credit_refuse' ? 'danger' : 'info'
          });
        }

        // Si Client : on ne garde que ses propres comptes/crédits, comme partout ailleurs dans l'app
        const mesComptes =
          role === 'client' && currentUser?.clientId
            ? comptes.filter((c) => c.clientId === currentUser.clientId)
            : comptes;

        const mesCredits =
          role === 'client' && currentUser?.clientId
            ? credits.filter((c) => c.clientId === currentUser.clientId)
            : credits;

        // Alerte solde bas
        for (const compte of mesComptes) {
          if (compte.statut === 'actif' && compte.solde < SEUIL_SOLDE_BAS) {
            notifications.push({
              id: `solde-${compte.id}`,
              type: 'solde_bas',
              message: `Solde bas sur le compte ${compte.numeroCompte} (${compte.solde.toLocaleString('fr-FR')} XOF)`,
              niveau: 'warning'
            });
          }
        }

        // Alerte échéance de crédit proche ou dépassée
        const aujourdHui = new Date();
        for (const credit of mesCredits) {
          if (credit.statut !== 'approuve') continue;

          for (const echeance of credit.echeancier) {
            if (echeance.payee) continue;

            const dateEcheance = new Date(echeance.dateEcheance);
            const joursRestants = Math.ceil((dateEcheance.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24));

            if (joursRestants < 0) {
              notifications.push({
                id: `echeance-${credit.id}-${echeance.numero}`,
                type: 'echeance_depassee',
                message: `Échéance ${echeance.numero} du crédit #${credit.id} dépassée (${echeance.dateEcheance})`,
                niveau: 'danger'
              });
            } else if (joursRestants <= JOURS_ALERTE_ECHEANCE) {
              notifications.push({
                id: `echeance-${credit.id}-${echeance.numero}`,
                type: 'echeance_proche',
                message: `Échéance ${echeance.numero} du crédit #${credit.id} dans ${joursRestants} jour(s)`,
                niveau: 'warning'
              });
            }
          }
        }

        return notifications;
      })
    );
  }
}