import { Component } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';

interface PaymentDetail {
  periodo: number;
  fechaPago: Date;
  saldoInicial: number;
  cuota: number;
  interes: number;
  amortizacion: number;
  saldoFinal: number;
  seguroDesgravamen: number;
  seguroInmueble: number;
  cuotaTotal: number;
}

interface ClienteData {
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  ingresoMensual: number;
  ocupacion: string;
  estadoCivil: string;
  direccion: string;
}

interface PropiedadData {
  codigo: string;
  tipo: string;
  direccion: string;
  area: number;
  precio: number;
  numeroHabitaciones: number;
  numeroBanos: number;
  distrito: string;
  provincia: string;
}

@Component({
  selector: 'app-paymentplan.component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './paymentplan.component.html',
  styleUrl: './paymentplan.component.css',
  standalone: true
})
export class PaymentplanComponent {
  currentStep = 1;
  totalSteps = 4;

  clienteForm: FormGroup = new FormGroup({});
  propiedadForm: FormGroup = new FormGroup({});
  prestamoForm: FormGroup = new FormGroup({});

  showResults = false;
  paymentPlan: PaymentDetail[] = [];

  // Datos almacenados
  clienteData: ClienteData | null = null;
  propiedadData: PropiedadData | null = null;

  // Cálculos financieros
  cuotaMensual = 0;
  totalIntereses = 0;
  totalPagado = 0;

  // Indicadores financieros
  tea = 0;
  tcea = 0;
  trea = 0;
  van = 0;
  tir = 0;

  // Seguros y comisiones
  seguroDesgravamen = 0; // 0.05% del saldo
  seguroInmueble = 0; // 0.03% del valor de la propiedad
  comisionActivacion = 0;
  comisionPrepago = 0; // 1.5% del saldo
  tasaMoratoria = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForms();
  }

  initForms() {
    // Formulario de Cliente
    this.clienteForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      ingresoMensual: ['', [Validators.required, Validators.min(1)]],
      ocupacion: ['', Validators.required],
      estadoCivil: ['', Validators.required],
      direccion: ['', Validators.required]
    });

    // Formulario de Propiedad
    this.propiedadForm = this.fb.group({
      codigo: ['', Validators.required],
      tipo: ['', Validators.required],
      direccion: ['', Validators.required],
      area: ['', [Validators.required, Validators.min(1)]],
      precio: ['', [Validators.required, Validators.min(1)]],
      numeroHabitaciones: ['', [Validators.required, Validators.min(1)]],
      numeroBanos: ['', [Validators.required, Validators.min(1)]],
      distrito: ['', Validators.required],
      provincia: ['', Validators.required]
    });

    // Formulario de Préstamo
    this.prestamoForm = this.fb.group({
      montoPrestamo: ['', [Validators.required, Validators.min(1)]],
      cuotaInicial: ['', [Validators.required, Validators.min(0)]],
      bonoTechoPropio: [false],
      montoBono: [0],
      tasaInteres: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      plazo: ['', [Validators.required, Validators.min(12), Validators.max(360)]],
      moneda: ['PEN', Validators.required],
      tipoTasa: ['efectiva', Validators.required],
      periodoGraciaTotal: [0, [Validators.min(0), Validators.max(24)]],
      periodoGraciaParcial: [0, [Validators.min(0), Validators.max(24)]],
      entidadFinanciera: ['', Validators.required],
      tasaSeguroDesgravamen: [0.05, Validators.required],
      tasaSeguroInmueble: [0.03, Validators.required],
      comisionActivacion: [0, Validators.min(0)],
      tasaMoratoria: [5, [Validators.required, Validators.min(0)]]
    });
  }

  nextStep() {
    if (this.currentStep === 1 && this.clienteForm.valid) {
      this.clienteData = this.clienteForm.value;
      this.currentStep++;
    } else if (this.currentStep === 2 && this.propiedadForm.valid) {
      this.propiedadData = this.propiedadForm.value;
      this.currentStep++;
    } else if (this.currentStep === 3 && this.prestamoForm.valid) {
      this.currentStep++;
      this.calculatePaymentPlan();
    } else {
      this.markFormGroupTouched(this.getCurrentForm());
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  getCurrentForm(): FormGroup {
    switch (this.currentStep) {
      case 1: return this.clienteForm;
      case 2: return this.propiedadForm;
      case 3: return this.prestamoForm;
      default: return this.clienteForm;
    }
  }

  calculatePaymentPlan() {
    const formData = this.prestamoForm.value;

    let monto = parseFloat(formData.montoPrestamo);
    const cuotaInicial = parseFloat(formData.cuotaInicial);
    const montoBono = formData.bonoTechoPropio ? parseFloat(formData.montoBono) : 0;

    // Monto neto del préstamo
    monto = monto - cuotaInicial - montoBono;

    // Convertir tasa según tipo
    let tasaMensual = 0;
    if (formData.tipoTasa === 'efectiva') {
      // TEA a TEM
      const tea = parseFloat(formData.tasaInteres) / 100;
      tasaMensual = Math.pow(1 + tea, 1/12) - 1;
    } else {
      // TNA a TEM
      tasaMensual = (parseFloat(formData.tasaInteres) / 100) / 12;
    }

    const plazo = parseInt(formData.plazo);
    const periodoGraciaTotal = parseInt(formData.periodoGraciaTotal);
    const periodoGraciaParcial = parseInt(formData.periodoGraciaParcial);

    // Calcular seguros
    this.seguroDesgravamen = parseFloat(formData.tasaSeguroDesgravamen) / 100;
    this.seguroInmueble = parseFloat(formData.tasaSeguroInmueble) / 100;
    this.comisionActivacion = parseFloat(formData.comisionActivacion);
    this.tasaMoratoria = parseFloat(formData.tasaMoratoria) / 100;

    // Calcular cuota mensual (método francés)
    const plazoPago = plazo - periodoGraciaTotal - periodoGraciaParcial;
    this.cuotaMensual = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazoPago)) /
      (Math.pow(1 + tasaMensual, plazoPago) - 1);

    // Generar cronograma
    this.paymentPlan = [];
    let saldo = monto;
    this.totalIntereses = 0;
    const fechaInicio = new Date();

    for (let i = 1; i <= plazo; i++) {
      const interes = saldo * tasaMensual;
      let amortizacion = 0;
      let cuota = 0;

      // Período de gracia total
      if (i <= periodoGraciaTotal) {
        cuota = 0;
        amortizacion = 0;
        saldo += interes; // Se capitaliza el interés
      }
      // Período de gracia parcial
      else if (i <= periodoGraciaTotal + periodoGraciaParcial) {
        cuota = interes;
        amortizacion = 0;
      }
      // Período normal
      else {
        cuota = this.cuotaMensual;
        amortizacion = cuota - interes;
        saldo -= amortizacion;
      }

      // Calcular seguros
      const segDesgravanmen = saldo * this.seguroDesgravamen;
      const segInmueble = (this.propiedadData?.precio || 0) * this.seguroInmueble;
      const cuotaTotal = cuota + segDesgravanmen + segInmueble;

      const fechaPago = new Date(fechaInicio);
      fechaPago.setMonth(fechaPago.getMonth() + i);

      this.paymentPlan.push({
        periodo: i,
        fechaPago: fechaPago,
        saldoInicial: i === 1 ? monto : this.paymentPlan[i-2].saldoFinal,
        cuota: cuota,
        interes: interes,
        amortizacion: amortizacion,
        saldoFinal: saldo > 0 ? saldo : 0,
        seguroDesgravamen: segDesgravanmen,
        seguroInmueble: segInmueble,
        cuotaTotal: cuotaTotal
      });

      this.totalIntereses += interes;
    }

    this.totalPagado = monto + this.totalIntereses;

    // Calcular indicadores
    this.calculateFinancialIndicators(monto, tasaMensual);

    this.showResults = true;
  }

  calculateFinancialIndicators(monto: number, tasaMensual: number) {
    // TEA
    this.tea = (Math.pow(1 + tasaMensual, 12) - 1) * 100;

    // TCEA (incluye seguros y comisiones)
    const costoTotal = this.totalPagado + this.comisionActivacion +
      (this.paymentPlan.reduce((sum, p) => sum + p.seguroDesgravamen + p.seguroInmueble, 0));
    this.tcea = ((costoTotal / monto) - 1) * 100;

    // TREA (para el prestamista)
    this.trea = this.tea; // Simplificado

    // VAN (Valor Actual Neto)
    const tasaDescuento = 0.10; // 10% anual
    this.van = -monto;
    this.paymentPlan.forEach((payment, index) => {
      this.van += payment.cuotaTotal / Math.pow(1 + tasaDescuento/12, index + 1);
    });

    // TIR (Tasa Interna de Retorno) - Aproximación
    this.tir = this.calculateTIR(monto);
  }

  calculateTIR(monto: number): number {
    // Método de Newton-Raphson para calcular TIR
    let tir = 0.1; // Estimación inicial 10%
    const tolerance = 0.0001;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      let npv = -monto;
      let dnpv = 0;

      this.paymentPlan.forEach((payment, index) => {
        const period = index + 1;
        npv += payment.cuotaTotal / Math.pow(1 + tir, period / 12);
        dnpv -= (period / 12) * payment.cuotaTotal / Math.pow(1 + tir, period / 12 + 1);
      });

      const newTir = tir - npv / dnpv;

      if (Math.abs(newTir - tir) < tolerance) {
        return newTir * 100;
      }

      tir = newTir;
    }

    return tir * 100;
  }

  resetForm() {
    this.currentStep = 1;
    this.showResults = false;
    this.clienteForm.reset();
    this.propiedadForm.reset();
    this.prestamoForm.reset({
      moneda: 'PEN',
      tipoTasa: 'efectiva',
      periodoGraciaTotal: 0,
      periodoGraciaParcial: 0,
      bonoTechoPropio: false,
      tasaSeguroDesgravamen: 0.05,
      tasaSeguroInmueble: 0.03,
      tasaMoratoria: 5
    });
    this.paymentPlan = [];
    this.clienteData = null;
    this.propiedadData = null;
  }

  editClient() {
    this.currentStep = 1;
    this.showResults = false;
  }

  editProperty() {
    this.currentStep = 2;
    this.showResults = false;
  }

  editLoan() {
    this.currentStep = 3;
    this.showResults = false;
  }

  exportToPDF() {
    // Aquí irá la lógica de exportación a PDF
    alert('Exportando a PDF...');
  }

  saveToDatabase() {
    // Aquí irá la lógica para guardar en el backend
    const dataToSave = {
      cliente: this.clienteData,
      propiedad: this.propiedadData,
      prestamo: this.prestamoForm.value,
      cronograma: this.paymentPlan,
      indicadores: {
        tea: this.tea,
        tcea: this.tcea,
        trea: this.trea,
        van: this.van,
        tir: this.tir
      }
    };

    console.log('Datos a guardar:', dataToSave);
    alert('Datos guardados exitosamente en la base de datos');
  }

  logout() {
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
