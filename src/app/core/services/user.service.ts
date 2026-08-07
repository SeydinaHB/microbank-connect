import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

const API_URL = 'http://localhost:3001';
const MOT_DE_PASSE_PAR_DEFAUT = 'password123';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/users`);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${API_URL}/users/${id}`);
  }

  create(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(`${API_URL}/users`, user);
  }

  update(id: number, user: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${API_URL}/users/${id}`, user);
  }

  // Crée le compte de connexion d'un client tout juste créé, avec mot de passe par défaut à changer obligatoirement
  createUserForClient(clientId: number, nom: string, prenom: string, email: string): Observable<User> {
    return this.create({
      nom,
      prenom,
      email,
      role: 'client',
      clientId,
      password: MOT_DE_PASSE_PAR_DEFAUT,
      mustChangePassword: true
    });
  }
}