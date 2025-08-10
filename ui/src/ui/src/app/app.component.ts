import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    NgIf,
    RouterOutlet,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Personalization';
  user: SocialUser | null = null;
  userSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to the AuthService to get real-time user updates
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.user = user;
    });
  }

  // Method to handle logout
  logout(): void {
    // Call the social login service to sign out from Google
    this.socialAuthService.signOut().then(() => {
      // Clear the user from our local service
      this.authService.clearUser();
      // Redirect to the login page
      this.router.navigate(['/login']);
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
