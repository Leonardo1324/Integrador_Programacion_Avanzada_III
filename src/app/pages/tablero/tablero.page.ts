import { Component } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
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
  estados: Estado[] = []; 
  columnasConectadas: string[] = [];
  tareas: Tarea[] = [];
  
  isLoading = false; 

  constructor(
    private tareasService: TareasService, 
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {}

  ionViewWillEnter() {
    this.cargarDatos();
  }

  //Nuevo método centralizado para cargar datos
  private cargarDatos() {
    this.isLoading = true;
    
    forkJoin({
      estados: this.tareasService.obtenerEstados(),
      tareas: this.tareasService.obtenerTareas()
    })
    .pipe(
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (results) => {
        this.estados = results.estados;
        this.tareas = results.tareas;
        this.actualizarColumnasConectadas();
      },
      error: (err) => {
        console.error('Error al cargar datos del Tablero:', err);
      }
    });
  }

  actualizarColumnasConectadas() {
    this.columnasConectadas = this.estados.map(e => e.clave);
  }

  obtenerTareasPorEstado(estado: string): Tarea[] {
    return this.tareas.filter(t => t.estado === estado);
  }

  //Agregar columna
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
              this.tareasService.agregarEstado(nombreColumna).subscribe({
                next: (nuevoEstado) => {
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

  //Eliminar columna
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
            const tareasAEliminar = this.tareas.filter(t => t.estado === clave);
            const deleteTasks$ = tareasAEliminar.map(t => this.tareasService.eliminarTarea(t.id));
            const deleteColumn$ = this.tareasService.eliminarEstado(clave);

            forkJoin([...deleteTasks$, deleteColumn$]).subscribe({
                next: () => {
                    this.tareas = this.tareas.filter(t => t.estado !== clave);
                    this.estados = this.estados.filter(e => e.clave !== clave);
                    this.actualizarColumnasConectadas();
                },
                error: (err) => console.error('Error al eliminar columna y tareas:', err)
            });
          }
        }
      ]
    });
    await alert.present();
  }

  agregarTarea(estado: string) {
    this.navCtrl.navigateForward(['/tarea-form'], {
      queryParams: { estado, modo: 'crear' }
    });
  }

  //Mover tareas (Requiere actualizar el estado en el servidor)
  dropTarea(event: CdkDragDrop<Tarea[]>, nuevoEstado: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const tareaMovida = event.previousContainer.data[event.previousIndex];
      this.tareasService.cambiarEstado(tareaMovida.id, nuevoEstado).subscribe({
        next: () => {
          tareaMovida.estado = nuevoEstado;
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
          this.tareas = [...this.tareas];
        },
        error: (err) => console.error('Error al mover tarea:', err)
      });
    }
  }

  //Mover columnas (Requiere actualizar el orden en el servidor)
  dropColumna(event: CdkDragDrop<any[]>) {
    this.tareasService.moverEstado(event.previousIndex, event.currentIndex).subscribe({
        next: (estadosActualizados) => {
            this.estados = estadosActualizados; 
            this.actualizarColumnasConectadas();
        },
        error: (err) => console.error('Error al mover columna:', err)
    });
  }

  //FUNCIÓN PARA ELIMINAR UNA TAREA
  public eliminarTarea(tareaAeliminar: Tarea): void {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar la tarea: "${tareaAeliminar.titulo}"?`);

    if (confirmar) {
        this.tareasService.eliminarTarea(tareaAeliminar.id).subscribe({
            next: () => {
                this.tareas = this.tareas.filter(t => t.id !== tareaAeliminar.id);
                console.log(`Tarea ${tareaAeliminar.titulo} eliminada del servidor.`);
            },
            error: (err) => console.error('Error al eliminar tarea:', err)
        });
    }
  }

  //Editar tarea existente
  public editarTarea(tarea: Tarea): void {
    this.navCtrl.navigateForward(['/tarea-form'], {
      queryParams: {
        id: tarea.id,
        estado: tarea.estado,
        modo: 'editar'
      }
    });
  }
}
