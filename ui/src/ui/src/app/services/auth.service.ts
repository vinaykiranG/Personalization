import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocialUser } from '@abacritt/angularx-social-login';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Use a BehaviorSubject to hold and emit the user state
  private userSubject = new BehaviorSubject<SocialUser | null>(null);
  public user$: Observable<SocialUser | null> = this.userSubject.asObservable();

  constructor() {
    // Restore user state from local storage on service initialization
    const storedUser = localStorage.getItem('socialUser');
    if (storedUser) {
      this.userSubject.next(JSON.parse(storedUser));
    }
  }

  // Set the user data and store it
  setUser(user: SocialUser): void {
    localStorage.setItem('socialUser', JSON.stringify(user));
    this.userSubject.next(user);
  }

  // Clear user data for logout
  clearUser(): void {
    localStorage.removeItem('socialUser');
    this.userSubject.next(null);
  }

  // Check if a user is currently authenticated
  isAuthenticated(): boolean {
    return this.userSubject.getValue() !== null;
  }
}
