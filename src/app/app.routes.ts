import { RouterModule, Routes } from '@angular/router';
import {AuthComponent} from './components/auth.component/auth.component';
import {PaymentplanComponent} from './components/paymentplan.component/paymentplan.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'payment-plan', component: PaymentplanComponent },
  { path: 'clients', component: ClientsComponent },
];

export class AppRoutingModule { }
