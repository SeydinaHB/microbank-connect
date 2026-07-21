export type StatutCredit = 'simulation' | 'en_attente' | 'approuve' | 'refuse' | 'solde';

export interface Echeance {
  numero: number;
  dateEcheance: string;   // format ISO
  montant: number;
  payee: boolean;
}

export interface Credit {
  id: number;
  clientId: number;
  montant: number;
  tauxInteret: number;      // en %, ex: 5.5
  dureeMois: number;
  mensualite: number;
  dateDemande: string;      // format ISO
  statut: StatutCredit;
  echeancier: Echeance[];
}