// AuthService.ts
export class AuthService {
  public async login() {
    return { id: 'u1', name: 'Player 1' };
  }
  public async logout() {
  }
}

export const authService = new AuthService();
