import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

export function roleGuard(allowedRoles: Role[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.userRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // Utilisateur connecté mais pas autorisé pour cette route -> retour au dashboard
    // Utilisateur non connecté -> vers le login
    router.navigate([userRole ? '/dashboard' : '/auth/login']);
    return false;
  };
}