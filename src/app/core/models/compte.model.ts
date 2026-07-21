export type TypeCompte = 'courant' | 'epargne';
export type StatutCompte = 'actif' | 'suspendu' | 'cloture';

export interface Compte {
  id: number;
  numeroCompte: string;
  clientId: number;       // référence vers Client.id
  type: TypeCompte;
  solde: number;
  devise: string;         // ex: 'XOF'
  dateOuverture: string;  // format ISO
  statut: StatutCompte;
}