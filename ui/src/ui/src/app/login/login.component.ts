import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocialAuthService, SocialLoginModule } from '@abacritt/angularx-social-login';
import { AuthService } from '../services/auth.service';
import { SocialUser } from '@abacritt/angularx-social-login';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [SocialLoginModule, MatCardModule],
})
export class LoginComponent implements OnInit {
  constructor(
    private socialAuthService: SocialAuthService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to the authState to handle successful logins
    this.socialAuthService.authState.subscribe((user: SocialUser) => {
      if (user) {
        // Update our AuthService with the user data
        this.authService.setUser(user);
        // Navigate to the main dashboard after successful login
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
