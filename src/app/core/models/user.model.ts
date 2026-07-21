export type Role = 'client' | 'agent' | 'gestionnaire';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  clientId?: number; // rempli uniquement si role === 'client'
}

export interface AuthResponse {
  user: User;
  token: string;
}