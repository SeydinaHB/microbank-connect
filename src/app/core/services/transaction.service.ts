import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction.model';

const API_URL = 'http://localhost:3001';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);

  getAll(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${API_URL}/transactions?_sort=date&_order=desc`);
  }

  getByCompteId(compteId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${API_URL}/transactions?compteId=${compteId}&_sort=date&_order=desc`);
  }

  create(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    return this.http.post<Transaction>(`${API_URL}/transactions`, transaction);
  }
}