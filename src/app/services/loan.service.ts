import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface LoanRequestDTO {
  clientID: number;
  asesorID: number | null;
  financialEntityID: number;
  principal: number;
  years: number;
  totalGrace: number;
  partialGrace: number;
  propertyId: number | null;
  rateType: string;
  tea: number | null;
  tnp: number | null;
  capitalizationFrequencyID: number | null;
  cok: number;
  propertyPrice: number;
}

export interface LoanResponseDTO {
  loanId: number;
  tir: number;
  tcea: number;
  van: number;
  schedule: LoanInstallmentDTO[];
  propertyPrice: number;
  downPayment: number;
  downPaymentPercentage: number;
  financedAmount: number;
  financialEntity: string;
}

export interface LoanInstallmentDTO {
  period: number;
  initialBalance: number;
  interest: number;
  amortization: number;
  fee: number;
  finalBalance: number;
  cashFlow: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  createFrenchLoan(loanRequest: LoanRequestDTO): Observable<LoanResponseDTO> {
    return this.http.post<LoanResponseDTO>(
      `${this.apiUrl}/loan/french`,
      loanRequest,
      { headers: this.getHeaders() }
    );
  }

  getScheduleByLoanId(loanId: number): Observable<LoanInstallmentDTO[]> {
    return this.http.get<LoanInstallmentDTO[]>(
      `${this.apiUrl}/loan/${loanId}/schedule`,
      { headers: this.getHeaders() }
    );
  }

  getLoansByClient(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/loan/cliente/${clientId}`,
      { headers: this.getHeaders() }
    );
  }
}
