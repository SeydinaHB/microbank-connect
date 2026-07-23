import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable , map} from 'rxjs';
import { Transaction } from '../models/transaction.model';

const API_URL = 'http://localhost:3001';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);

  getAll(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${API_URL}/transactions?_sort=date&_order=desc`);
  }

  getByCompteId(compteId: number): Observable<Transaction[]> {
  // On récupère tout, puis on filtre sur compteId (source) OU compteDestinataireId (réception d'un virement)
  // json-server ne permet pas nativement une condition "OU" sur 2 champs différents en une seule requête
  return this.http.get<Transaction[]>(`${API_URL}/transactions?_sort=date&_order=desc`).pipe(
    map((transactions) =>
      transactions.filter((t) => t.compteId === compteId || t.compteDestinataireId === compteId)
    )
  );
}

  create(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    return this.http.post<Transaction>(`${API_URL}/transactions`, transaction);
  }
}