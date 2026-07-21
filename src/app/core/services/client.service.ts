import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../models/client.model';

const API_URL = 'http://localhost:3001';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private http = inject(HttpClient);

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>(`${API_URL}/clients`);
  }

  getById(id: number): Observable<Client> {
    return this.http.get<Client>(`${API_URL}/clients/${id}`);
  }

  search(query: string): Observable<Client[]> {
    // json-server permet de faire une recherche full-text avec ?q=
    return this.http.get<Client[]>(`${API_URL}/clients?q=${query}`);
  }

  create(client: Omit<Client, 'id'>): Observable<Client> {
    return this.http.post<Client>(`${API_URL}/clients`, client);
  }

  update(id: number, client: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${API_URL}/clients/${id}`, client);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/clients/${id}`);
  }
}