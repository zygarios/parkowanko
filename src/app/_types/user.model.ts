export interface User {
    id: number;
    email: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
}
