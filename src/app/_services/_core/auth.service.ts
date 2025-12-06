import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthResponse, User } from '../../_types/user.model';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private _httpClient = inject(HttpClient);
    private _router = inject(Router);

    private _currentUser: WritableSignal<User | null> = signal<User | null>(null);
    currentUser = this._currentUser.asReadonly();
    isLoggedIn = computed(() => !!this._currentUser());

    private tokenExpirationTimer: any;

    constructor() {
        this.tryAutoLogin();
    }

    login(data: any): Observable<AuthResponse> {
        return this._httpClient.post<AuthResponse>(`${environment.apiUrl}/auth/login/`, data).pipe(
            tap((res) => this.handleAuthentication(res)),
            catchError((err) => throwError(() => err)),
        );
    }

    register(data: any): Observable<AuthResponse> {
        return this._httpClient.post<AuthResponse>(`${environment.apiUrl}/auth/register/`, data).pipe(
            tap((res) => this.handleAuthentication(res)),
            catchError((err) => throwError(() => err)),
        );
    }

    refreshToken(token: string): Observable<AuthResponse> {
        return this._httpClient
            .post<AuthResponse>(`${environment.apiUrl}/auth/refresh/`, { refresh: token })
            .pipe(
                tap((res) => this.handleAuthentication(res)),
                catchError((err) => throwError(() => err)));
    }

    logout() {
        this._currentUser.set(null);
        localStorage.removeItem('auth_data');
        if (this.tokenExpirationTimer) {
            clearTimeout(this.tokenExpirationTimer);
        }
        this._router.navigate(['/auth']);
    }

    private handleAuthentication(res: AuthResponse) {
        this._currentUser.set(res.user);
        localStorage.setItem('auth_data', JSON.stringify(res));

        const decodedToken: any = jwtDecode(res.access);
        const expirationDate = new Date(decodedToken.exp * 1000);
        this.autoLogout(expirationDate.getTime() - new Date().getTime());
    }

    private tryAutoLogin() {
        const storedData = localStorage.getItem('auth_data');

        if (!storedData) {
            return;
        }

        try {
            const authData: AuthResponse = JSON.parse(storedData);
            if (!authData.access || !authData.user) {
                return;
            }

            const decodedToken: any = jwtDecode(authData.access);
            const expirationDate = new Date(decodedToken.exp * 1000);
            const now = new Date();

            if (expirationDate > now) {
                this._currentUser.set(authData.user);
                this.autoLogout(expirationDate.getTime() - now.getTime());
            } else {
                this.logout();
            }
        } catch (e) {
            this.logout();
        }
    }

    private autoLogout(expirationDuration: number) {
        if (this.tokenExpirationTimer) {
            clearTimeout(this.tokenExpirationTimer);
        }
        this.tokenExpirationTimer = setTimeout(() => {
            this.logout();
        }, expirationDuration);
    }

    private getAuthDataFromLocalStorage(): AuthResponse | null {
        const data = localStorage.getItem('auth_data');
        return data ? JSON.parse(data) : null;
    }

    getToken(): string | null {
        return this.getAuthDataFromLocalStorage()?.access || null;
    }

    getRefreshToken(): string | null {
        return this.getAuthDataFromLocalStorage()?.refresh || null;
    }
}
