import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usuarioActual = new BehaviorSubject<string | null>(null);

  // Observable para escuchar cambios
  usuario$ = this.usuarioActual.asObservable();

  // Establecer usuario
  login(nombre: string) {
    this.usuarioActual.next(nombre);
    localStorage.setItem('usuario', nombre);
  }

  // Cerrar sesión
  logout() {
    this.usuarioActual.next(null);
    localStorage.removeItem('usuario');
  }

  // Obtener usuario actual (sincrónicamente)
  getUsuario(): string | null {
    return this.usuarioActual.value || localStorage.getItem('usuario');
  }
}
