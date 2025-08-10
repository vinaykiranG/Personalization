import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { HeaderComponent } from './core/header/header.component';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NgIf],
  template: `
    <app-header *ngIf="auth.isAuthenticated()"></app-header>
    <router-outlet></router-outlet>
  `,
})
export class RootComponent {
  constructor(public auth: AuthService) {}
}