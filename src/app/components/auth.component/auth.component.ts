import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector: 'app-auth.component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
  standalone: true
})
export class AuthComponent {
  isLoginMode = true;

  constructor(private router: Router) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onLogin() {
    //event.preventDefault();
    // Aquí irá la validación del backend
    // Por ahora navegamos directamente
    this.router.navigate(['/payment-plan']);
  }

  onSignup() {
    //event.preventDefault();
    // Aquí irá la validación del backend
    // Por ahora navegamos directamente
    this.router.navigate(['/payment-plan']);
  }

}
