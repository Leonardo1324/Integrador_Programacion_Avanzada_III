import { Component } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
// Importamos la interfaz Estado para usar la lista dinámica
import { TareasService, Tarea, Estado } from '../../services/tareas'; 
import { 
  IonButton, 
  IonIcon, 
  IonCardContent, 
  IonCard, 
  IonCardTitle, 
  IonCardHeader, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonLabel, 
  IonContent, 
  IonMenuButton 
} from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Necesario para los observables en TypeScript
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.page.html',
  styleUrls: ['./tablero.page.scss'],
  standalone: true, 
  imports: [
    IonButton, CommonModule, DragDropModule, IonIcon, IonCardContent, IonCard,
    IonCardTitle, IonCardHeader, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonLabel, IonContent,
    IonMenuButton
],
})
export class TableroPage {
  // Ahora estas variables se llenarán con los datos del servidor
  estados: Estado[] = []; 
  columnasConectadas: string[] = [];
  tareas: Tarea[] = [];
  
  isLoading = false; // Indicador de carga para la UI

  constructor(
    private tareasService: TareasService, 
    private alertCtrl: AlertController,
    private navCtrl: NavController // Opcional, pero útil para navegación
  ) {}

  ionViewWillEnter() {
    this.cargarDatos();
  }

  // Nuevo método centralizado para cargar datos
  private cargarDatos() {
    this.isLoading = true;
    
    // Usamos forkJoin para cargar Tareas y Estados en paralelo
    forkJoin({
      estados: this.tareasService.obtenerEstados(),
      tareas: this.tareasService.obtenerTareas()
    })
    .pipe(
      finalize(() => this.isLoading = false) // Desactiva la carga al finalizar
    )
    .subscribe({
      next: (results) => {
        // Asignar los datos obtenidos del servidor
        this.estados = results.estados;
        this.tareas = results.tareas;
        this.actualizarColumnasConectadas();
      },
      error: (err) => {
        console.error('Error al cargar datos del Tablero:', err);
        // Mostrar un error al usuario (ej. con AlertController)
      }
    });
  }

  actualizarColumnasConectadas() {
    this.columnasConectadas = this.estados.map(e => e.clave);
  }

  obtenerTareasPorEstado(estado: string): Tarea[] {
    // Nota: Esta función filtra el array local this.tareas, que se cargó desde la API.
    return this.tareas.filter(t => t.estado === estado);
  }

  // 🟢 Agregar columna
  async agregarColumna() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva columna',
      inputs: [{ name: 'nombre', type: 'text', placeholder: 'Ej: En revisión' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: data => {
            if (data.nombre.trim()) {
              const nombreColumna = data.nombre.trim();

              // LLAMADA ASÍNCRONA: Usar el servicio para crear el recurso en el servidor
              this.tareasService.agregarEstado(nombreColumna).subscribe({
                next: (nuevoEstado) => {
                  console.log('Columna agregada en el servidor:', nuevoEstado);
                  // Actualizar la lista local sin recargar toda la página
                  this.estados.push(nuevoEstado);
                  this.actualizarColumnasConectadas();
                },
                error: (err) => console.error('Error al agregar columna:', err)
              });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  // 🔴 Eliminar columna
  async eliminarColumna(clave: string) {
    const columna = this.estados.find(c => c.clave === clave);
    if (!columna) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar columna',
      message: `¿Seguro que deseas eliminar la columna <b>${columna.nombre}</b> y todas sus tareas?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            // 1. Eliminar Tareas asociadas a esta columna (Idealmente en cascada en el backend)
            const tareasAEliminar = this.tareas.filter(t => t.estado === clave);
            
            // Usamos forkJoin para eliminar todas las tareas y luego la columna
            const deleteTasks$ = tareasAEliminar.map(t => this.tareasService.eliminarTarea(t.id));
            const deleteColumn$ = this.tareasService.eliminarEstado(clave);

            forkJoin([...deleteTasks$, deleteColumn$]).subscribe({
                next: () => {
                    // Actualizar las listas locales si el servidor tuvo éxito
                    this.tareas = this.tareas.filter(t => t.estado !== clave);
                    this.estados = this.estados.filter(e => e.clave !== clave);
                    this.actualizarColumnasConectadas();
                    console.log(`Columna ${columna!.nombre} y tareas eliminadas.`);
                },
                error: (err) => console.error('Error al eliminar columna y tareas:', err)
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // 🟡 Agregar tarea
  async agregarTarea(estado: string) {
    const alert = await this.alertCtrl.create({
      header: 'Nueva tarea',
      inputs: [{ name: 'titulo', type: 'text', placeholder: 'Título de la tarea' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: data => {
            if (data.titulo.trim()) {
              // LLAMADA ASÍNCRONA: Agregar tarea al servidor
              this.tareasService.agregarTarea(data.titulo).subscribe({
                next: (nuevaTarea) => {
                  nuevaTarea.estado = estado; // Aseguramos que la tarea esté en el estado correcto localmente
                  this.tareas.push(nuevaTarea); // Actualizar array local
                  this.tareas = [...this.tareas]; // Forzar detección de cambios para la UI
                },
                error: (err) => console.error('Error al agregar tarea:', err)
              });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  // 🟠 Mover tareas (Requiere actualizar el estado en el servidor)
  dropTarea(event: CdkDragDrop<Tarea[]>, nuevoEstado: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      // Nota: Si quieres guardar el orden de las tareas, necesitarías otra llamada al servicio aquí.
    } else {
      const tareaMovida = event.previousContainer.data[event.previousIndex];
      
      // 1. LLAMADA ASÍNCRONA: Actualizar estado de la tarea en el servidor
      this.tareasService.cambiarEstado(tareaMovida.id, nuevoEstado).subscribe({
        next: () => {
          // 2. Si el servidor tiene éxito, actualizamos la vista local
          tareaMovida.estado = nuevoEstado;
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
          this.tareas = [...this.tareas]; // Forzar refresh si es necesario
        },
        error: (err) => console.error('Error al mover tarea:', err)
      });
    }
  }

  // 🔵 Mover columnas (Requiere actualizar el orden en el servidor)
  dropColumna(event: CdkDragDrop<any[]>) {
    // 1. LLAMADA ASÍNCRONA: Usar el servicio para mover la columna en el maestro
    this.tareasService.moverEstado(event.previousIndex, event.currentIndex).subscribe({
        next: (estadosActualizados) => {
            // 2. Actualizar la vista local y las conexiones con la nueva lista del servidor
            this.estados = estadosActualizados; 
            this.actualizarColumnasConectadas();
        },
        error: (err) => console.error('Error al mover columna:', err)
    });
  }

  // 🔥 FUNCIÓN PARA ELIMINAR UNA TAREA 🔥
  public eliminarTarea(tareaAeliminar: Tarea): void {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar la tarea: "${tareaAeliminar.titulo}"?`);

    if (confirmar) {
        // LLAMADA ASÍNCRONA: Eliminar tarea del servidor
        this.tareasService.eliminarTarea(tareaAeliminar.id).subscribe({
            next: () => {
                // Si el servidor tiene éxito, eliminar de la lista local
                this.tareas = this.tareas.filter(t => t.id !== tareaAeliminar.id);
                console.log(`Tarea ${tareaAeliminar.titulo} eliminada del servidor.`);
            },
            error: (err) => console.error('Error al eliminar tarea:', err)
        });
    }
  }
}
