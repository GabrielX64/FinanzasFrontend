import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClientService, ClientDTO, MaritalStatusDTO } from '../../services/client.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {
  clients: ClientDTO[] = [];
  filteredClients: ClientDTO[] = [];
  maritalStatuses: MaritalStatusDTO[] = [];

  showModal = false;
  editingClient: ClientDTO | null = null;
  clientForm!: FormGroup;
  searchTerm = '';

  isLoading = false;
  errorMessage = '';

  constructor(
    private clientService: ClientService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadClients();
    this.loadMaritalStatuses();
  }

  private initializeForm() {
    this.clientForm = this.fb.group({
      clientID: [null],
      names: ['', [Validators.required, Validators.minLength(2)]],
      surnames: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      monthlyIncome: ['', [Validators.required, Validators.min(1)]],
      occupation: ['', Validators.required],
      maritalStatusID: ['', Validators.required],
      currentAddress: ['', Validators.required]
    });
  }

  loadClients() {
    this.clientService.getAllClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.filteredClients = data;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.errorMessage = 'Error al cargar clientes';
      }
    });
  }

  loadMaritalStatuses() {
    this.clientService.getMaritalStatuses().subscribe({
      next: (data) => {
        this.maritalStatuses = data;
      },
      error: (error) => {
        console.error('Error loading marital statuses:', error);
      }
    });
  }

  onSearchChange() {
    const term = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.names.toLowerCase().includes(term) ||
      client.surnames.toLowerCase().includes(term) ||
      client.dni.includes(term)
    );
  }

  openAddModal() {
    this.editingClient = null;
    this.clientForm.reset();
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(client: ClientDTO) {
    this.editingClient = client;
    this.clientForm.patchValue(client);
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal() {
    this.showModal = false;
    this.clientForm.reset();
    this.errorMessage = '';
  }

  onSubmit() {
    if (this.clientForm.invalid) {
      this.markFormGroupTouched(this.clientForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const clientData: ClientDTO = {
      ...this.clientForm.value,
      monthlyIncome: Number(this.clientForm.value.monthlyIncome),
      maritalStatusID: Number(this.clientForm.value.maritalStatusID)
    };

    const request = this.editingClient
      ? this.clientService.updateClient(clientData)
      : this.clientService.createClient(clientData);

    request.subscribe({
      next: () => {
        this.loadClients();
        this.closeModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving client:', error);
        this.errorMessage = error.error?.message || 'Error al guardar el cliente';
        this.isLoading = false;
      }
    });
  }

  deleteClient(clientId: number) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    this.clientService.deleteClient(clientId).subscribe({
      next: () => {
        this.loadClients();
      },
      error: (error) => {
        console.error('Error deleting client:', error);
        alert('Error al eliminar el cliente');
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasError(field: string, error: string): boolean {
    const control = this.clientForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.clientForm.get(field);
    return !!(control && control.invalid && control.touched);
  }
}
