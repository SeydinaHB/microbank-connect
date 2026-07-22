import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Compte } from '../models/compte.model';

const API_URL = 'http://localhost:3001';

@Injectable({ providedIn: 'root' })
export class CompteService {
  private http = inject(HttpClient);

  getAll(): Observable<Compte[]> {
    return this.http.get<Compte[]>(`${API_URL}/comptes`);
  }

  getById(id: number): Observable<Compte> {
    return this.http.get<Compte>(`${API_URL}/comptes/${id}`);
  }

  getByClientId(clientId: number): Observable<Compte[]> {
    return this.http.get<Compte[]>(`${API_URL}/comptes?clientId=${clientId}`);
  }

  create(compte: Omit<Compte, 'id'>): Observable<Compte> {
    return this.http.post<Compte>(`${API_URL}/comptes`, compte);
  }

  update(id: number, compte: Partial<Compte>): Observable<Compte> {
    return this.http.put<Compte>(`${API_URL}/comptes/${id}`, compte);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/comptes/${id}`);
  }
}