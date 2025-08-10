import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './auth/auth.guard';
import { RootComponent } from './root.component';
import { AppComponent } from './app.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: RootComponent,
    children: [
      { path: 'app', component: AppComponent, canActivate: [authGuard] },
    ],
  },
  { path: '**', redirectTo: 'login' },
];