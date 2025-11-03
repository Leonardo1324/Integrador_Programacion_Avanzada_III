import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: string;
  asignadoA?: string;
}

export interface Estado {
  clave: string;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class TareasService {

  actualizarTarea(taskId: number, tareaData: Tarea) {
    return this.http.put<Tarea>(`${this.tareasUrl}/${taskId}`, tareaData);
  }

  obtenerTareaPorId(taskId: number) {
    return this.http.get<Tarea>(`${this.tareasUrl}/${taskId}`);
  }

  private readonly apiUrl = 'http://192.168.56.1:3000';
  private readonly tareasUrl = `${this.apiUrl}/tareas`;
  private readonly estadosUrl = `${this.apiUrl}/estados`;

  private tareas: Tarea[] = [];
  private estadosList: Estado[] = [];

  constructor(private http: HttpClient) {
    this.obtenerEstados().subscribe(estados => this.estadosList = estados);
    this.obtenerTareas().subscribe(tareas => this.tareas = tareas);
  }

  obtenerTareas(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(this.tareasUrl);
  }

  agregarTarea(titulo: string, descripcion: string | undefined, estado: string, asignadoA?: string | undefined): Observable<Tarea> {
    const nuevaTarea: Omit<Tarea, 'id'> = { 
      titulo: titulo, 
      estado: estado,
      descripcion: descripcion,
      asignadoA: asignadoA
    };
    return this.http.post<Tarea>(this.tareasUrl, nuevaTarea);
  }

  cambiarEstado(id: number, nuevoEstado: Tarea['estado']): Observable<Tarea> {
    const url = `${this.tareasUrl}/${id}`;
    return this.http.patch<Tarea>(url, { estado: nuevoEstado });
  }

  eliminarTarea(id: number): Observable<any> {
    const url = `${this.tareasUrl}/${id}`;
    return this.http.delete(url);
  }

  obtenerPorEstado(estado: Tarea['estado']): Observable<Tarea[]> {
    const url = `${this.tareasUrl}?estado=${estado}`;
    return this.http.get<Tarea[]>(url);
  }

  obtenerEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(this.estadosUrl);
  }

  agregarEstado(nombre: string): Observable<Estado> {
    const clave = nombre.toLowerCase().replace(/\s+/g, '_');
    const nuevoEstado: Omit<Estado, 'id'> = { clave, nombre };
    return this.http.post<Estado>(this.estadosUrl, nuevoEstado);
  }

  eliminarEstado(clave: string): Observable<any> {
    const url = `${this.estadosUrl}/${clave}`;
    return this.http.delete(url);
  }

  moverEstado(previousIndex: number, currentIndex: number): Observable<Estado[]> {
    const currentStates = [...this.estadosList];
    const [movedItem] = currentStates.splice(previousIndex, 1);
    currentStates.splice(currentIndex, 0, movedItem);
    this.estadosList = currentStates;
    return new Observable<Estado[]>(observer => {
      observer.next(currentStates);
      observer.complete();
    });
  }
}
