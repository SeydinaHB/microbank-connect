import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse, Role } from '../models/user.model';

const API_URL = 'http://localhost:3001';
const TOKEN_KEY = 'microbank_token';
const USER_KEY = 'microbank_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signal privé contenant l'utilisateur connecté (ou null si déconnecté)
  private currentUserSignal = signal<User | null>(this.loadUserFromStorage());

  // Exposé en lecture seule aux composants
  currentUser = this.currentUserSignal.asReadonly();

  // Signals dérivés (computed) très pratiques pour les templates et les guards
  isAuthenticated = computed(() => this.currentUserSignal() !== null);
  userRole = computed<Role | null>(() => this.currentUserSignal()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    // json-server ne gère pas nativement l'auth : on simule en filtrant les users
    return this.http
      .get<User[]>(`${API_URL}/users?email=${email}&password=${password}`)
      .pipe(
        tap((users) => {
          if (users.length === 0) {
            throw new Error('Identifiants invalides');
          }
        }),
        // On transforme le résultat en AuthResponse avec un faux token
        // (on garde ça simple car aucun backend réel n'est requis)
        // @ts-ignore - simplification volontaire pour le mock
        tap((users) => {
          const user = users[0];
          const fakeToken = `fake-jwt-token-${user.id}-${Date.now()}`;
          this.setSession(user, fakeToken);
        })
      ) as unknown as Observable<AuthResponse>;
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setSession(user: User, token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private loadUserFromStorage(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}