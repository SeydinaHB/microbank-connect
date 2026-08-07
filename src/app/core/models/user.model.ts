export type Role = 'client' | 'agent' | 'gestionnaire';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  clientId?: number; // rempli uniquement si role === 'client'
  password: string;
  mustChangePassword?: boolean; // true tant que le mot de passe par défaut n'a pas été changé
}

export interface AuthResponse {
  user: User;
  token: string;
}