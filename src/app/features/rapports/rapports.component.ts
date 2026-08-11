import { Component, inject, signal, OnInit, computed, AfterViewInit, ElementRef, ViewChild } from '@angular/core';import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { CompteService } from '../../core/services/compte.service';
import { ClientService } from '../../core/services/client.service';
import { CreditService } from '../../core/services/credit.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Compte } from '../../core/models/compte.model';
import { Client } from '../../core/models/client.model';
import { Credit } from '../../core/models/credit.model';
import { Transaction } from '../../core/models/transaction.model';
import jsPDF from 'jspdf';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);


@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './rapports.component.html'
})
export class RapportsComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCredits') chartCreditsRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartComptes') chartComptesRef!: ElementRef<HTMLCanvasElement>;

  private chartCreditsInstance: Chart | null = null;
  private chartComptesInstance: Chart | null = null;  private compteService = inject(CompteService);
  private clientService = inject(ClientService);
  private creditService = inject(CreditService);
  private transactionService = inject(TransactionService);

  comptes = signal<Compte[]>([]);
  clients = signal<Client[]>([]);
  credits = signal<Credit[]>([]);
  transactions = signal<Transaction[]>([]);
  isLoading = signal(true);

  // --- Indicateurs calculés (signals dérivés basés sur les données chargées) ---

  nombreClients = computed(() => this.clients().length);

  nombreComptesActifs = computed(() => this.comptes().filter((c) => c.statut === 'actif').length);

  encoursTotal = computed(() => this.comptes().reduce((total, c) => total + c.solde, 0));

  volumeTransactionsMois = computed(() => {
    const maintenant = new Date();
    return this.transactions()
      .filter((t) => {
        const date = new Date(t.date);
        return date.getMonth() === maintenant.getMonth() && date.getFullYear() === maintenant.getFullYear();
      })
      .reduce((total, t) => total + t.montant, 0);
  });

  creditsEnAttente = computed(() => this.credits().filter((c) => c.statut === 'en_attente').length);

  creditsApprouves = computed(() => this.credits().filter((c) => c.statut === 'approuve').length);

  encoursCreditsApprouves = computed(() =>
    this.credits()
      .filter((c) => c.statut === 'approuve')
      .reduce((total, c) => total + c.montant, 0)
  );

  repartitionParType = computed(() => {
    const courant = this.comptes().filter((c) => c.type === 'courant').length;
    const epargne = this.comptes().filter((c) => c.type === 'epargne').length;
    const total = courant + epargne || 1; // évite une division par zéro si aucun compte
    return {
      courant,
      epargne,
      pourcentageCourant: Math.round((courant / total) * 100),
      pourcentageEpargne: Math.round((epargne / total) * 100)
    };
  });

  ngOnInit(): void {
    forkJoin({
      comptes: this.compteService.getAll(),
      clients: this.clientService.getAll(),
      credits: this.creditService.getAll(),
      transactions: this.transactionService.getAll()
    }).subscribe({
      next: ({ comptes, clients, credits, transactions }) => {
        this.comptes.set(comptes);
        this.clients.set(clients);
        this.credits.set(credits);
        this.transactions.set(transactions);
        this.isLoading.set(false);
        // Les graphiques ne peuvent être dessinés qu'une fois le <canvas> présent dans le DOM,
        // donc on attend le prochain cycle de rendu (les données viennent d'arriver après le @if isLoading)
        setTimeout(() => this.dessinerGraphiques(), 0);
      },
      error: () => this.isLoading.set(false)
    });
  }

  ngAfterViewInit(): void {
    // Si les données étaient déjà là au moment du premier rendu (cas rare), on dessine directement
    if (!this.isLoading()) {
      this.dessinerGraphiques();
    }
  }

  private dessinerGraphiques(): void {
    if (!this.chartCreditsRef || !this.chartComptesRef) return;

    // Détruire les instances précédentes pour éviter les doublons si on revient sur la page
    this.chartCreditsInstance?.destroy();
    this.chartComptesInstance?.destroy();

    // --- Graphique 1 : répartition des crédits par statut (anneau) ---
    const approuves = this.credits().filter((c) => c.statut === 'approuve').length;
    const enAttente = this.credits().filter((c) => c.statut === 'en_attente').length;
    const refuses = this.credits().filter((c) => c.statut === 'refuse').length;

    this.chartCreditsInstance = new Chart(this.chartCreditsRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Approuvés', 'En attente', 'Refusés'],
        datasets: [{
          data: [approuves, enAttente, refuses],
          backgroundColor: ['#02C39A', '#D97706', '#DC2626'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }
      }
    });

    // --- Graphique 2 : comptes courants vs épargne (barres) ---
    const courants = this.comptes().filter((c) => c.type === 'courant');
    const epargnes = this.comptes().filter((c) => c.type === 'epargne');
    const soldeCourants = courants.reduce((t, c) => t + c.solde, 0);
    const soldeEpargnes = epargnes.reduce((t, c) => t + c.solde, 0);

    this.chartComptesInstance = new Chart(this.chartComptesRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Comptes courants', 'Comptes épargne'],
        datasets: [{
          label: 'Encours (XOF)',
          data: [soldeCourants, soldeEpargnes],
          backgroundColor: ['#028090', '#00A896'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: (value) => Number(value).toLocaleString('fr-FR') } }
        }
      }
    });
  }
  exporterPDF(): void {
    const doc = new jsPDF();
    const dateGeneration = new Date().toLocaleDateString('fr-FR');

    // En-tête
    doc.setFontSize(18);
    doc.setTextColor(2, 128, 144); // teal
    doc.text('MicroBank Connect', 14, 18);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Rapport de synthèse', 14, 26);
    doc.setFontSize(9);
    doc.text(`Généré le ${dateGeneration}`, 14, 32);

    doc.setDrawColor(200);
    doc.line(14, 36, 196, 36);

    let y = 46;

    // Indicateurs clés
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // navy
    doc.text('Indicateurs clés', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(60);
    const indicateurs: [string, string][] = [
      ['Clients enregistrés', String(this.nombreClients())],
      ['Comptes actifs', String(this.nombreComptesActifs())],
      ['Encours total', `${this.encoursTotal().toLocaleString('fr-FR')} XOF`],
      ['Volume transactions (mois)', `${this.volumeTransactionsMois().toLocaleString('fr-FR')} XOF`]
    ];
    for (const [label, valeur] of indicateurs) {
      doc.text(`${label} :`, 14, y);
      doc.text(valeur, 100, y);
      y += 7;
    }

    y += 6;
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('Portefeuille crédits', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(60);
    const credits: [string, string][] = [
      ['Crédits approuvés', String(this.creditsApprouves())],
      ['Crédits en attente', String(this.creditsEnAttente())],
      ['Encours crédits approuvés', `${this.encoursCreditsApprouves().toLocaleString('fr-FR')} XOF`]
    ];
    for (const [label, valeur] of credits) {
      doc.text(`${label} :`, 14, y);
      doc.text(valeur, 100, y);
      y += 7;
    }

    y += 6;
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('Répartition des comptes', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(60);
    const repartition = this.repartitionParType();
    doc.text(`Comptes courants : ${repartition.courant} (${repartition.pourcentageCourant}%)`, 14, y);
    y += 7;
    doc.text(`Comptes épargne : ${repartition.epargne} (${repartition.pourcentageEpargne}%)`, 14, y);
// Ajout des graphiques sous forme d'images, sur une nouvelle page pour rester lisible
    if (this.chartCreditsInstance && this.chartComptesInstance) {
      doc.addPage();

      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Répartition des crédits', 14, 20);
      const imageCredits = this.chartCreditsInstance.toBase64Image();
      doc.addImage(imageCredits, 'PNG', 14, 26, 85, 65);

      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Encours par type de compte', 110, 20);
      const imageComptes = this.chartComptesInstance.toBase64Image();
      doc.addImage(imageComptes, 'PNG', 110, 26, 85, 65);
    }
    doc.save(`rapport-microbank-${dateGeneration.replace(/\//g, '-')}.pdf`);
  }
}