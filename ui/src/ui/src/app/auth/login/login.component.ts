import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

// declare GSI global
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  error: string | null = null;
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  onSubmit() {
    try {
      const v = this.form.value;
      this.auth.loginLocal(v.email!, v.password!);
      this.router.navigate(['/app']);
    } catch (e: any) {
      this.error = e?.message || 'Login failed';
    }
  }

  ngAfterViewInit() {
    const clientId = (window as any).GOOGLE_CLIENT_ID || 'REPLACE_WITH_GOOGLE_CLIENT_ID';
    if ((window as any).google) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => this.handleCredentialResponse(resp),
      });
      const btn = document.getElementById('gsi-button');
      if (btn) {
        google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large', width: 300 });
      }
    }
  }

  private handleCredentialResponse(response: any) {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const profile = { name: payload.name, email: payload.email, picture: payload.picture };
      this.auth.registerOrLoginGoogle(profile);
      this.router.navigate(['/app']);
    } catch (e) {
      this.error = 'Google sign-in failed';
    }
  }
}