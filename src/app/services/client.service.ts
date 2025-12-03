import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ClientDTO {
  clientID?: number;
  names: string;
  surnames: string;
  dni: string;
  email: string;
  phoneNumber: string;
  monthlyIncome: number;
  occupation: string;
  maritalStatusID: number;
  currentAddress: string;
}

export interface MaritalStatusDTO {
  maritalStatusId: number;
  statusName: string;
}

export interface FinancialEntityDTO {
  financialEntityID: number;
  name: string;
  code: string;
  downPaymentPercentage: number;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
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

  createClient(client: ClientDTO): Observable<ClientDTO> {
    return this.http.post<ClientDTO>(
      `${this.apiUrl}/cliente`,
      client,
      { headers: this.getHeaders() }
    );
  }

  updateClient(client: ClientDTO): Observable<ClientDTO> {
    return this.http.put<ClientDTO>(
      `${this.apiUrl}/cliente/update`,
      client,
      { headers: this.getHeaders() }
    );
  }

  getClientById(id: number): Observable<ClientDTO> {
    return this.http.get<ClientDTO>(
      `${this.apiUrl}/cliente/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getMaritalStatuses(): Observable<MaritalStatusDTO[]> {
    return this.http.get<MaritalStatusDTO[]>(
      `${this.apiUrl}/estados-civiles`,
      { headers: this.getHeaders() }
    );
  }

  getFinancialEntities(): Observable<FinancialEntityDTO[]> {
    return this.http.get<FinancialEntityDTO[]>(
      `${this.apiUrl}/entidades-financieras/activas`,
      { headers: this.getHeaders() }
    );
  }
}
