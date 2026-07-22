import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Credit } from '../models/credit.model';

const API_URL = 'http://localhost:3001';

@Injectable({ providedIn: 'root' })
export class CreditService {
  private http = inject(HttpClient);

  getAll(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${API_URL}/credits`);
  }

  getById(id: number): Observable<Credit> {
    return this.http.get<Credit>(`${API_URL}/credits/${id}`);
  }

  getByClientId(clientId: number): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${API_URL}/credits?clientId=${clientId}`);
  }

  create(credit: Omit<Credit, 'id'>): Observable<Credit> {
    return this.http.post<Credit>(`${API_URL}/credits`, credit);
  }

  update(id: number, credit: Partial<Credit>): Observable<Credit> {
    // On utilise PATCH (pas PUT) pour ne modifier que les champs fournis,
    // et éviter le bug qu'on a eu sur les comptes (écrasement des autres champs)
    return this.http.patch<Credit>(`${API_URL}/credits/${id}`, credit);
  }
}