import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface PropertyType {
  propertyTypeID: number;
  name: string;
}

export interface Currency {
  currencyID: number;
  code: string;
  name: string;
  symbol: string;
}

export interface PropertyStatus {
  statusID: number;
  name: string;
}

export interface PropertyDTO {
  propertyID?: number;
  code: string;
  address: string;
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  salePrice: number;
  type?: PropertyType;
  currency?: Currency;
  status?: PropertyStatus;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
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

  getAllProperties(): Observable<PropertyDTO[]> {
    return this.http.get<PropertyDTO[]>(
      `${this.apiUrl}/propiedades`,
      { headers: this.getHeaders() }
    );
  }

  getPropertyById(id: number): Observable<PropertyDTO> {
    return this.http.get<PropertyDTO>(
      `${this.apiUrl}/propiedad/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createProperty(property: PropertyDTO): Observable<PropertyDTO> {
    return this.http.post<PropertyDTO>(
      `${this.apiUrl}/propiedad`,
      property,
      { headers: this.getHeaders() }
    );
  }

  updateProperty(property: PropertyDTO): Observable<PropertyDTO> {
    return this.http.put<PropertyDTO>(
      `${this.apiUrl}/propiedad/update`,
      property,
      { headers: this.getHeaders() }
    );
  }

  deleteProperty(id: number): Observable<string> {
    return this.http.delete<string>(
      `${this.apiUrl}/propiedad/delete/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getAvailableProperties(): Observable<PropertyDTO[]> {
    return this.http.get<PropertyDTO[]>(
      `${this.apiUrl}/propiedades/disponibles`,
      { headers: this.getHeaders() }
    );
  }

  getPropertiesByStatus(statusId: number): Observable<PropertyDTO[]> {
    return this.http.get<PropertyDTO[]>(
      `${this.apiUrl}/propiedades/estado/${statusId}`,
      { headers: this.getHeaders() }
    );
  }

  getPropertiesByType(typeId: number): Observable<PropertyDTO[]> {
    return this.http.get<PropertyDTO[]>(
      `${this.apiUrl}/propiedades/tipo/${typeId}`,
      { headers: this.getHeaders() }
    );
  }

  // Catálogos
  getPropertyTypes(): Observable<PropertyType[]> {
    // Por ahora devuelve datos hardcodeados, puedes crear endpoints en el backend si lo necesitas
    return new Observable(observer => {
      observer.next([
        { propertyTypeID: 1, name: 'Casa' },
        { propertyTypeID: 2, name: 'Departamento' },
        { propertyTypeID: 3, name: 'Terreno' },
        { propertyTypeID: 4, name: 'Local Comercial' },
        { propertyTypeID: 5, name: 'Oficina' }
      ]);
      observer.complete();
    });
  }

  getCurrencies(): Observable<Currency[]> {
    return new Observable(observer => {
      observer.next([
        { currencyID: 1, code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
        { currencyID: 2, code: 'USD', name: 'Dólar Americano', symbol: '$' }
      ]);
      observer.complete();
    });
  }

  getPropertyStatuses(): Observable<PropertyStatus[]> {
    return new Observable(observer => {
      observer.next([
        { statusID: 1, name: 'Disponible' },
        { statusID: 2, name: 'Reservada' },
        { statusID: 3, name: 'Vendida' },
        { statusID: 4, name: 'En Construcción' }
      ]);
      observer.complete();
    });
  }
}
