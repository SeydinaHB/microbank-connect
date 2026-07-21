export type TypeTransaction = 'depot' | 'retrait' | 'virement';
export type StatutTransaction = 'reussie' | 'echouee' | 'en_attente';

export interface Transaction {
  id: number;
  compteId: number;           // compte concerné (compte source pour un virement)
  compteDestinataireId?: number; // rempli uniquement pour un virement
  type: TypeTransaction;
  montant: number;
  date: string;                // format ISO
  statut: StatutTransaction;
  libelle?: string;            // description libre, ex: "Virement loyer"
}