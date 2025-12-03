import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PropertyService, PropertyDTO } from '../../services/property.service';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.css']
})
export class PropertiesComponent implements OnInit {
  properties: PropertyDTO[] = [];
  filteredProperties: PropertyDTO[] = [];
  propertyTypes: any[] = [];
  currencies: any[] = [];
  propertyStatuses: any[] = [];

  showModal = false;
  editingProperty: PropertyDTO | null = null;
  propertyForm!: FormGroup;
  searchTerm = '';

  isLoading = false;
  errorMessage = '';

  constructor(
    private propertyService: PropertyService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadProperties();
    this.loadCatalogs();
  }

  private initializeForm() {
    this.propertyForm = this.fb.group({
      propertyID: [null],
      code: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      areaM2: ['', [Validators.required, Validators.min(1)]],
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      salePrice: ['', [Validators.required, Validators.min(1)]],
      typeId: ['', Validators.required],
      currencyId: ['', Validators.required],
      statusId: ['', Validators.required]
    });
  }

  loadProperties() {
    this.propertyService.getAllProperties().subscribe({
      next: (data) => {
        this.properties = data;
        this.filteredProperties = data;
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.errorMessage = 'Error al cargar propiedades';
      }
    });
  }

  loadCatalogs() {
    this.propertyService.getPropertyTypes().subscribe({
      next: (data) => this.propertyTypes = data,
      error: (error) => console.error('Error loading property types:', error)
    });

    this.propertyService.getCurrencies().subscribe({
      next: (data) => this.currencies = data,
      error: (error) => console.error('Error loading currencies:', error)
    });

    this.propertyService.getPropertyStatuses().subscribe({
      next: (data) => this.propertyStatuses = data,
      error: (error) => console.error('Error loading property statuses:', error)
    });
  }

  onSearchChange() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProperties = this.properties.filter(property =>
      property.code.toLowerCase().includes(term) ||
      property.address.toLowerCase().includes(term)
    );
  }

  openAddModal() {
    this.editingProperty = null;
    this.propertyForm.reset({
      typeId: '1',
      currencyId: '1',
      statusId: '1'
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(property: PropertyDTO) {
    this.editingProperty = property;
    this.propertyForm.patchValue({
      propertyID: property.propertyID,
      code: property.code,
      address: property.address,
      areaM2: property.areaM2,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      salePrice: property.salePrice,
      typeId: property.type?.propertyTypeID || '1',
      currencyId: property.currency?.currencyID || '1',
      statusId: property.status?.statusID || '1'
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal() {
    this.showModal = false;
    this.propertyForm.reset();
    this.errorMessage = '';
  }

  onSubmit() {
    if (this.propertyForm.invalid) {
      this.markFormGroupTouched(this.propertyForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.propertyForm.value;

    const propertyData: PropertyDTO = {
      propertyID: formValue.propertyID,
      code: formValue.code,
      address: formValue.address,
      areaM2: Number(formValue.areaM2),
      bedrooms: Number(formValue.bedrooms),
      bathrooms: Number(formValue.bathrooms),
      salePrice: Number(formValue.salePrice),
      type: { propertyTypeID: Number(formValue.typeId) },
      currency: { currencyID: Number(formValue.currencyId) },
      status: { statusID: Number(formValue.statusId) }
    };

    const request = this.editingProperty
      ? this.propertyService.updateProperty(propertyData)
      : this.propertyService.createProperty(propertyData);

    request.subscribe({
      next: () => {
        this.loadProperties();
        this.closeModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving property:', error);
        this.errorMessage = error.error?.message || 'Error al guardar la propiedad';
        this.isLoading = false;
      }
    });
  }

  deleteProperty(propertyId: number) {
    if (!confirm('¿Estás seguro de eliminar esta propiedad?')) return;

    this.propertyService.deleteProperty(propertyId).subscribe({
      next: () => {
        this.loadProperties();
      },
      error: (error) => {
        console.error('Error deleting property:', error);
        alert('Error al eliminar la propiedad');
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
    const control = this.propertyForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.propertyForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getPropertyTypeName(typeId?: number): string {
    if (!typeId) return 'N/A';
    const type = this.propertyTypes.find(t => t.propertyTypeID === typeId);
    return type?.name || 'N/A';
  }

  getCurrencySymbol(currencyId?: number): string {
    if (!currencyId) return '';
    const currency = this.currencies.find(c => c.currencyID === currencyId);
    return currency?.symbol || '';
  }

  getStatusName(statusId?: number): string {
    if (!statusId) return 'N/A';
    const status = this.propertyStatuses.find(s => s.statusID === statusId);
    return status?.name || 'N/A';
  }
}
