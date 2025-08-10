import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash?: string;
  picture?: string;
  provider: 'local' | 'google';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private USERS_KEY = 'app_users';
  private CURRENT_KEY = 'app_current_user';

  constructor(private router: Router) {}

  private getUsers(): User[] {
    return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]') as User[];
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  registerLocal(name: string, email: string, password: string): User {
    const users = this.getUsers();
    if (users.some(u => u.email === email)) throw new Error('User already registered');
    const passwordHash = CryptoJS.SHA256(password).toString();
    const user: User = { id: Date.now(), name, email, passwordHash, provider: 'local' };
    users.push(user);
    this.saveUsers(users);
    this.setCurrentUser(user);
    return user;
  }

  registerOrLoginGoogle(profile: { name: string; email: string; picture?: string }): User {
    const users = this.getUsers();
    let user = users.find(u => u.email === profile.email);
    if (!user) {
      user = { id: Date.now(), name: profile.name, email: profile.email, picture: profile.picture, provider: 'google' };
      users.push(user);
      this.saveUsers(users);
    }
    this.setCurrentUser(user);
    return user;
  }

  loginLocal(email: string, password: string): User {
    const users = this.getUsers();
    const hash = CryptoJS.SHA256(password).toString();
    const user = users.find(u => u.email === email && u.passwordHash === hash);
    if (!user) throw new Error('Invalid credentials');
    this.setCurrentUser(user);
    return user;
  }

  setCurrentUser(u: User) {
    localStorage.setItem(this.CURRENT_KEY, JSON.stringify(u));
  }

  getCurrentUser(): User | null {
    const s = localStorage.getItem(this.CURRENT_KEY);
    return s ? (JSON.parse(s) as User) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  logout() {
    localStorage.removeItem(this.CURRENT_KEY);
    this.router.navigate(['/login']);
  }
}