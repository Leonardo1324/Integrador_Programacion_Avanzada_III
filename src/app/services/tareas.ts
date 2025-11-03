import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // 1. Importar HttpClient
import { Observable, lastValueFrom } from 'rxjs'; // 2. Importar herramientas de RxJS

export interface Tarea {
  id: number; // JSON Server requiere IDs para POST/PUT/DELETE
  titulo: string;
  descripcion?: string;
  estado: string; // La clave del estado (ej: 'por_hacer')
  asignadoA?: string;
}

// Interfaz para la definición de Estados/Columnas
export interface Estado {
  clave: string; // Identificador único (ej: 'por_hacer')
  nombre: string; // Nombre a mostrar (ej: 'Por hacer')
}

@Injectable({ providedIn: 'root' })
export class TareasService {

  actualizarTarea(taskId: number, tareaData: Tarea) {
    return this.http.put<Tarea>(`${this.tareasUrl}/${taskId}`, tareaData);
  }

  obtenerTareaPorId(taskId: number) {
    return this.http.get<Tarea>(`${this.tareasUrl}/${taskId}`);
  }

  // 3. URL base de JSON Server (Asegúrate de que este puerto coincida con tu configuración)
  private readonly apiUrl = 'http://localhost:3000'; 
  
  // Endpoints para las colecciones en el archivo db.json
  private readonly tareasUrl = `${this.apiUrl}/tareas`;
  private readonly estadosUrl = `${this.apiUrl}/estados`;

  // Las listas locales ahora son solo para inicialización (serán eliminadas o movidas
  // una vez que la aplicación se cargue y use la API)
  // Las mantendremos aquí por ahora, pero la lógica ya no las usará.
  
  private tareas: Tarea[] = []; // Se inicializará con la llamada a la API
  private estadosList: Estado[] = []; // Se inicializará con la llamada a la API

  // 4. Inyectar HttpClient
  constructor(private http: HttpClient) {
    // Inicializar estadosList si aún no se ha cargado (opcional, para fallbacks)
    this.obtenerEstados().subscribe(estados => this.estadosList = estados);
    // Inicializar tareas si aún no se han cargado (opcional, para fallbacks)
    this.obtenerTareas().subscribe(tareas => this.tareas = tareas);
  }

  // --- Métodos de Tareas (Ahora Asíncronos con Observable) ---

  obtenerTareas(): Observable<Tarea[]> {
    // GET: Recupera todas las tareas del servidor
    return this.http.get<Tarea[]>(this.tareasUrl);
  }

  agregarTarea(titulo: string, descripcion: string | undefined, estado: string, asignadoA?: string | undefined): Observable<Tarea> {
    const nuevaTarea: Omit<Tarea, 'id'> = { 
      titulo: titulo, 
      estado: estado,
      descripcion: descripcion,
      asignadoA: asignadoA// Asigna un estado por defecto, debe existir en 'estados'
    };
    // POST: Envía la nueva tarea al servidor (JSON Server asigna el ID)
    return this.http.post<Tarea>(this.tareasUrl, nuevaTarea);
  }

  cambiarEstado(id: number, nuevoEstado: Tarea['estado']): Observable<Tarea> {
    // PATCH: Solo actualiza el campo 'estado' para el ID dado
    const url = `${this.tareasUrl}/${id}`;
    return this.http.patch<Tarea>(url, { estado: nuevoEstado });
  }

  eliminarTarea(id: number): Observable<any> {
    // DELETE: Elimina la tarea por ID
    const url = `${this.tareasUrl}/${id}`;
    return this.http.delete(url);
  }

  // Este método aún se usa, pero funcionará sobre el array local sincronizado
  // o debes usar un filtro del servidor si el volumen es grande (no implementado aquí)
  obtenerPorEstado(estado: Tarea['estado']): Observable<Tarea[]> {
    // Usamos el query param de JSON Server para filtrar
    const url = `${this.tareasUrl}?estado=${estado}`;
    return this.http.get<Tarea[]>(url);
  }

  // --- Métodos de Gestión de Estados/Columnas (Ahora Asíncronos) ---

  /**
   * Obtiene la lista completa de estados/columnas disponibles.
   * Usamos Observable para mantener la coherencia con el servicio.
   */
  obtenerEstados(): Observable<Estado[]> {
    // GET: Obtiene todos los estados del servidor
    return this.http.get<Estado[]>(this.estadosUrl);
  }

  /**
   * Agrega un nuevo estado/columna al maestro de estados.
   * Para JSON Server, POST es la forma de agregar un nuevo recurso.
   */
  agregarEstado(nombre: string): Observable<Estado> {
    // La clave debe ser única, la creamos aquí (JSON Server asignará el ID)
    const clave = nombre.toLowerCase().replace(/\s+/g, '_');
    const nuevoEstado: Omit<Estado, 'id'> = { clave, nombre };
    
    // POST: Agrega el nuevo estado
    return this.http.post<Estado>(this.estadosUrl, nuevoEstado);
  }

  /**
   * Elimina un estado/columna del maestro.
   * NOTA: Esto no es trivial en REST ya que se necesita el ID de JSON Server,
   * pero asumiremos que el Tablero obtendrá el ID antes de llamar al servicio.
   * Aquí asumimos que la 'clave' (string) es el 'id' del recurso.
   */
  eliminarEstado(clave: string): Observable<any> {
    // DELETE: Elimina el estado por clave (asumida como ID en la URL)
    const url = `${this.estadosUrl}/${clave}`;
    return this.http.delete(url);
  }
  
  /**
   * Mover una columna en el maestro de estados es complejo con JSON Server
   * sin IDs o peticiones PUT complejas. Para simular el orden, haríamos un PUT
   * de toda la lista. Usaremos lastValueFrom para la simplicidad.
   */
  moverEstado(previousIndex: number, currentIndex: number): Observable<Estado[]> {
      // 1. Obtener la lista actual (sincronizada localmente)
      const currentStates = [...this.estadosList]; 

      // 2. Mover localmente
      const [movedItem] = currentStates.splice(previousIndex, 1);
      currentStates.splice(currentIndex, 0, movedItem);

      // 3. Reemplazar toda la colección en el servidor (requiere PUT en la URL de la colección o un endpoint específico)
      // JSON Server típicamente no soporta PUT/POST en la URL base para reescribir toda la colección fácilmente.
      // Para simular la persistencia, devolveremos el observable de la lista actualizada.
      
      // *** ADVERTENCIA: La persistencia de la reordenación de listas grandes
      // *** es compleja en JSON Server. Para simplificar, actualizaremos la 
      // *** lista local y la devolveremos.
      this.estadosList = currentStates;
      return new Observable<Estado[]>(observer => {
          observer.next(currentStates);
          observer.complete();
      });
  }
}
