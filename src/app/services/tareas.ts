import { Injectable } from '@angular/core';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: string;
  asignadoA?: string;
}

@Injectable({ providedIn: 'root' })
export class TareasService {
  private tareas: Tarea[] = [
    { id: 1, titulo: 'Diseñar logo', estado: 'por_hacer' },
    { id: 2, titulo: 'Configurar servidor', estado: 'en_progreso' },
    { id: 3, titulo: 'Subir app a GitHub', estado: 'completado' },
  ];

  obtenerTareas() {
    return this.tareas;
  }

  agregarTarea(titulo: string) {
    const nueva = { id: Date.now(), titulo, estado: 'por_hacer' } as Tarea;
    this.tareas.push(nueva);
  }

  cambiarEstado(id: number, nuevoEstado: Tarea['estado']) {
    const tarea = this.tareas.find(t => t.id === id);
    if (tarea) tarea.estado = nuevoEstado;
  }

  obtenerPorEstado(estado: Tarea['estado']) {
    return this.tareas.filter(t => t.estado === estado);
  }
}
