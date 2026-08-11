import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CompteService } from '../../../core/services/compte.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { NotificationRecordService } from '../../../core/services/notification-record.service';
import { Compte } from '../../../core/models/compte.model';

@Component({
  selector: 'app-operation-form',
  standalone: true,
  imports: [ReactiveFormsModule , DecimalPipe],
  templateUrl: './operation-form.component.html'
})
export class OperationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private compteService = inject(CompteService);
  private transactionService = inject(TransactionService);
  private notificationRecordService = inject(NotificationRecordService);
  private router = inject(Router);

  comptes = signal<Compte[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  operationForm = this.fb.group({
    type: ['depot', [Validators.required]],
    compteId: ['', [Validators.required]],
    compteDestinataireId: [''],
    montant: [0, [Validators.required, Validators.min(1)]],
    libelle: ['']
  });

 // Méthode (pas un computed) : relit toujours la valeur actuelle du formulaire, pas de cache figé
compteSource(): Compte | null {
  const id = Number(this.operationForm.get('compteId')?.value);
  return this.comptes().find((c) => c.id === id) ?? null;
}

  ngOnInit(): void {
    this.compteService.getAll().subscribe({
      next: (comptes) => this.comptes.set(comptes),
      error: () => this.errorMessage.set('Impossible de charger les comptes.')
    });

    // Re-valide le montant à chaque changement de compte ou de type (le plafond dépend du solde du compte choisi)
    this.operationForm.get('compteId')?.valueChanges.subscribe(() => this.revalidateMontant());
    this.operationForm.get('type')?.valueChanges.subscribe(() => this.revalidateMontant());
  }

  private revalidateMontant(): void {
    this.operationForm.get('montant')?.updateValueAndValidity();
  }

  // Validateur personnalisé : le montant ne doit jamais dépasser le solde disponible (dépôt exclu)
  montantValidator = (control: AbstractControl): ValidationErrors | null => {
    const type = this.operationForm?.get('type')?.value;
    const compte = this.compteSource();
    const montant = Number(control.value);

    if (type === 'depot' || !compte) {
      return null; // pas de plafond pour un dépôt
    }

    if (montant > compte.solde) {
      return { plafondDepasse: { solde: compte.solde } };
    }

    return null;
  };

  onSubmit(): void {
    const montantControl = this.operationForm.get('montant');
    montantControl?.setValidators([Validators.required, Validators.min(1), this.montantValidator]);
    montantControl?.updateValueAndValidity();

    if (this.operationForm.invalid) {
      this.operationForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

 const formValue = this.operationForm.value;
const compte = this.compteSource();

if (!compte) {
  this.isLoading.set(false);
  this.errorMessage.set('Veuillez sélectionner un compte valide.');
  return;
}

    const newTransaction = {
      compteId: Number(formValue.compteId),
      compteDestinataireId: formValue.type === 'virement' ? Number(formValue.compteDestinataireId) : undefined,
      type: formValue.type as 'depot' | 'retrait' | 'virement',
      montant: Number(formValue.montant),
      date: new Date().toISOString().split('T')[0],
      statut: 'reussie' as const,
      libelle: formValue.libelle || undefined
    };

    // Calcul du nouveau solde selon le type d'opération
    const soldeSource =
      formValue.type === 'depot' ? compte.solde + Number(formValue.montant) : compte.solde - Number(formValue.montant);

    this.transactionService.create(newTransaction).subscribe({
      next: () => {
        // On met à jour le solde du compte source
        this.compteService.update(compte.id, { solde: soldeSource }).subscribe({
          next: () => this.handleSuccessOrVirement(formValue),
          error: () => {
            this.isLoading.set(false);
            this.errorMessage.set('Transaction créée, mais échec de la mise à jour du solde.');
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set("Erreur lors de l'enregistrement de l'opération.");
      }
    });
  }

  private handleSuccessOrVirement(formValue: typeof this.operationForm.value): void {
    if (formValue.type === 'virement' && formValue.compteDestinataireId) {
      const compteDest = this.comptes().find((c) => c.id === Number(formValue.compteDestinataireId));
      if (compteDest) {
        this.compteService.update(compteDest.id, { solde: compteDest.solde + Number(formValue.montant) }).subscribe({
          next: () => this.finishSuccess(),
          error: () => {
            this.isLoading.set(false);
            this.errorMessage.set('Virement partiellement effectué : échec sur le compte destinataire.');
          }
        });
      }
    } else {
      this.finishSuccess();
    }
  }

private finishSuccess(): void {
    this.notifierClient();
    this.isLoading.set(false);
    this.successMessage.set('Opération effectuée avec succès !');
    setTimeout(() => this.router.navigate(['/comptes']), 1200);
  }

  // Crée une notification pour le(s) client(s) concerné(s) par l'opération
  private notifierClient(): void {
    const formValue = this.operationForm.value;
    const compte = this.compteSource();
    if (!compte) return;

    const montant = Number(formValue.montant);
    const type = formValue.type;

    if (type === 'depot') {
      this.notificationRecordService.creer(
        compte.clientId, 'operation',
        `Votre compte ${compte.numeroCompte} a été crédité de ${montant.toLocaleString('fr-FR')} XOF.`
      ).subscribe();
    } else if (type === 'retrait') {
      this.notificationRecordService.creer(
        compte.clientId, 'operation',
        `Un retrait de ${montant.toLocaleString('fr-FR')} XOF a été effectué sur votre compte ${compte.numeroCompte}.`
      ).subscribe();
    } else if (type === 'virement') {
      // Le client source est notifié du débit
      this.notificationRecordService.creer(
        compte.clientId, 'operation',
        `Un virement de ${montant.toLocaleString('fr-FR')} XOF a été émis depuis votre compte ${compte.numeroCompte}.`
      ).subscribe();

      // Le client destinataire est notifié du crédit (s'il est différent du client source)
      const compteDest = this.comptes().find((c) => c.id === Number(formValue.compteDestinataireId));
      if (compteDest && compteDest.clientId !== compte.clientId) {
        this.notificationRecordService.creer(
          compteDest.clientId, 'operation',
          `Votre compte ${compteDest.numeroCompte} a reçu un virement de ${montant.toLocaleString('fr-FR')} XOF.`
        ).subscribe();
      }
    }
  }
}