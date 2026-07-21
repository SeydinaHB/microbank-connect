export interface Client {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  dateNaissance: string; // format ISO: 'YYYY-MM-DD'
  numeroCni: string;     // numéro de carte d'identité
  dateCreation: string;  // date d'ouverture du dossier client
}