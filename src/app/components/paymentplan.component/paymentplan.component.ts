import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService, ClientDTO, MaritalStatusDTO, FinancialEntityDTO } from '../../services/client.service';
import { LoanService, LoanRequestDTO, LoanResponseDTO } from '../../services/loan.service';
import { AuthService } from '../../services/auth.service';

interface PaymentDetail {
  period: number;
  initialBalance: number;
  fee: number;
  interest: number;
  amortization: number;
  finalBalance: number;
  cashFlow: number;
}

@Component({
  selector: 'app-payment-plan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-plan.component.html',
  styleUrls: ['./payment-plan.component.css']
})
export class PaymentPlanComponent implements OnInit {
  currentStep = 1;

  clientForm: FormGroup;
  loanForm: FormGroup;

  showResults = false;
  paymentPlan: PaymentDetail[] = [];

  // Datos guardados
  clientData: ClientDTO | null = null;
  savedClientId: number | null = null;

  // Catálogos
  maritalStatuses: MaritalStatusDTO[] = [];
  financialEntities: FinancialEntityDTO[] = [];

  // Resultados
  cuotaMensual = 0;
  totalIntereses = 0;
  totalPagado = 0;
  tea = 0;
  tcea = 0;
  trea = 0;
  van = 0;
  tir = 0;
  downPayment = 0;
  downPaymentPercentage = 0;
  financedAmount = 0;
  selectedFinancialEntity = '';

  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clientService: ClientService,
    private loanService: LoanService,
    private authService: AuthService
  ) {
    this.clientForm = this.fb.group({
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

    this.loanForm = this.fb.group({
      propertyPrice: ['', [Validators.required, Validators.min(1)]],
      principal: ['', [Validators.required, Validators.min(1)]],
      years: ['', [Validators.required, Validators.min(1), Validators.max(30)]],
      totalGrace: [0, [Validators.min(0), Validators.max(24)]],
      partialGrace: [0, [Validators.min(0), Validators.max(24)]],
      financialEntityID: ['', Validators.required],
      rateType: ['TEA', Validators.required],
      tea: ['', [Validators.min(0), Validators.max(100)]],
      tnp: [''],
      capitalizationFrequencyID: [''],
      cok: [10, [Validators.required, Validators.min(0)]]
    });

    // Validar según tipo de tasa
    this.loanForm.get('rateType')?.valueChanges.subscribe(rateType => {
      const teaControl = this.loanForm.get('tea');
      const tnpControl = this.loanForm.get('tnp');
      const capControl = this.loanForm.get('capitalizationFrequencyID');

      if (rateType === 'TEA') {
        teaControl?.setValidators([Validators.required, Validators.min(0)]);
        tnpControl?.clearValidators();
        capControl?.clearValidators();
      } else {
        tnpControl?.setValidators([Validators.required, Validators.min(0)]);
        capControl?.setValidators([Validators.required]);
        teaControl?.clearValidators();
      }

      teaControl?.updateValueAndValidity();
      tnpControl?.updateValueAndValidity();
      capControl?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.loadCatalogs();
  }

  loadCatalogs() {
    this.clientService.getMaritalStatuses().subscribe({
      next: (data) => {
        this.maritalStatuses = data;
      },
      error: (error) => {
        console.error('Error cargando estados civiles:', error);
      }
    });

    this.clientService.getFinancialEntities().subscribe({
      next: (data) => {
        this.financialEntities = data;
      },
      error: (error) => {
        console.error('Error cargando entidades financieras:', error);
      }
    });
  }

  nextStep() {
    if (this.currentStep === 1 && this.clientForm.valid) {
      this.saveClient();
    } else if (this.currentStep === 2 && this.loanForm.valid) {
      this.calculateLoan();
    } else {
      this.markFormGroupTouched(this.getCurrentForm());
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  getCurrentForm(): FormGroup {
    return this.currentStep === 1 ? this.clientForm : this.loanForm;
  }

  saveClient() {
    this.isLoading = true;
    this.errorMessage = '';

    const clientData: ClientDTO = this.clientForm.value;

    this.clientService.createClient(clientData).subscribe({
      next: (response) => {
        console.log('Cliente creado:', response);
        this.clientData = response;
        this.savedClientId = response.clientID!;
        this.currentStep = 2;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al crear cliente:', error);
        this.errorMessage = error.error?.message || 'Error al guardar el cliente';
        this.isLoading = false;
      }
    });
  }

  calculateLoan() {
    if (!this.savedClientId) {
      this.errorMessage = 'Error: No se encontró el ID del cliente';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loanRequest: LoanRequestDTO = {
      clientID: this.savedClientId,
      asesorID: null,
      financialEntityID: Number(this.loanForm.value.financialEntityID),
      principal: Number(this.loanForm.value.principal),
      years: Number(this.loanForm.value.years),
      totalGrace: Number(this.loanForm.value.totalGrace),
      partialGrace: Number(this.loanForm.value.partialGrace),
      propertyId: null,
      rateType: this.loanForm.value.rateType,
      tea: this.loanForm.value.rateType === 'TEA' ? Number(this.loanForm.value.tea) / 100 : null,
      tnp: this.loanForm.value.rateType === 'TNP' ? Number(this.loanForm.value.tnp) / 100 : null,
      capitalizationFrequencyID: this.loanForm.value.capitalizationFrequencyID ? Number(this.loanForm.value.capitalizationFrequencyID) : null,
      cok: Number(this.loanForm.value.cok) / 100,
      propertyPrice: Number(this.loanForm.value.propertyPrice)
    };

    console.log('Enviando loan request:', loanRequest);

    this.loanService.createFrenchLoan(loanRequest).subscribe({
      next: (response: LoanResponseDTO) => {
        console.log('Préstamo creado:', response);

        this.van = response.van;
        this.tir = response.tir * 100;
        this.tcea = response.tcea * 100;
        this.trea = this.tcea;
        this.downPayment = response.downPayment;
        this.downPaymentPercentage = response.downPaymentPercentage;
        this.financedAmount = response.financedAmount;
        this.selectedFinancialEntity = response.financialEntity;

        // Calcular TEA
        if (response.schedule.length > 0) {
          const firstPayment = response.schedule[0];
          if (firstPayment.initialBalance > 0) {
            const monthlyRate = firstPayment.interest / firstPayment.initialBalance;
            this.tea = (Math.pow(1 + monthlyRate, 12) - 1) * 100;
          }
        }

        this.paymentPlan = response.schedule.map(item => ({
          period: item.period,
          initialBalance: item.initialBalance,
          fee: item.fee,
          interest: item.interest,
          amortization: item.amortization,
          finalBalance: item.finalBalance,
          cashFlow: item.cashFlow
        }));

        this.totalIntereses = this.paymentPlan.reduce((sum, p) => sum + p.interest, 0);
        this.totalPagado = this.paymentPlan.reduce((sum, p) => sum + p.fee, 0);
        this.cuotaMensual = this.paymentPlan.find(p => p.fee > 0)?.fee || 0;

        this.currentStep = 3;
        this.showResults = true;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al crear préstamo:', error);
        this.errorMessage = error.error?.message || 'Error al calcular el plan de pagos';
        this.isLoading = false;
      }
    });
  }

  resetForm() {
    this.currentStep = 1;
    this.showResults = false;
    this.clientForm.reset();
    this.loanForm.reset({
      rateType: 'TEA',
      totalGrace: 0,
      partialGrace: 0,
      cok: 10
    });
    this.paymentPlan = [];
    this.clientData = null;
    this.savedClientId = null;
    this.errorMessage = '';
  }

  editClient() {
    this.currentStep = 1;
    this.showResults = false;
  }

  editLoan() {
    this.currentStep = 2;
    this.showResults = false;
  }

  exportToPDF() {
    alert('Función de exportación a PDF en desarrollo');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasError(form: FormGroup, field: string, error: string): boolean {
    const control = form.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control && control.invalid && control.touched);
  }
}
