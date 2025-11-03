import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
// Importamos la interfaz Estado para usar la lista dinámica y el Observable
import { TareasService, Tarea, Estado } from '../../services/tareas'; 
import { 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonSelectOption, 
  IonSelect, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonMenuButton 
} from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';
import { finalize, forkJoin } from 'rxjs'; // Importamos finalize y forkJoin para llamadas asíncronas

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.page.html',
  styleUrls: ['./inbox.page.scss'],
  standalone: true, // Asegurar que es standalone
  imports: [
    IonContent, CommonModule, IonList, IonItem, IonLabel, IonSelectOption, IonSelect, 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonMenuButton
  ],
})
export class InboxPage {
  tareas: Tarea[] = [];
  estadosDisponibles: Estado[] = []; 
  isLoading = false; // Indicador de carga

  constructor(private tareasService: TareasService, private alertCtrl: AlertController) {}

  ionViewWillEnter() {
    this.cargarDatos();
  }

  // Nuevo método centralizado para cargar datos de forma asíncrona
  cargarDatos() {
    this.isLoading = true;
    
    // Usamos forkJoin para obtener tareas y estados en paralelo
    forkJoin({
      tareas: this.tareasService.obtenerTareas(),
      estados: this.tareasService.obtenerEstados()
    })
    .pipe(
      finalize(() => this.isLoading = false) // Desactiva la carga al finalizar
    )
    .subscribe({
      next: (results) => {
        this.tareas = results.tareas;
        this.estadosDisponibles = results.estados;
      },
      error: (err) => {
        console.error('Error al cargar datos del Inbox:', err);
      }
    });
  }

  async agregarTarea() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva tarea',
      inputs: [{ name: 'titulo', type: 'text', placeholder: 'Título de la tarea' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (data) => {
            if (data.titulo.trim()) {
              // LLAMADA ASÍNCRONA: Agregar tarea al servidor
              this.tareasService.agregarTarea(data.titulo).subscribe({
                next: () => {
                  // Volver a cargar los datos para actualizar la vista
                  this.cargarDatos(); 
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

  cambiarEstado(id: number, nuevoEstado: Tarea['estado']) {
    // LLAMADA ASÍNCRONA: Cambiar estado en el servidor
    this.tareasService.cambiarEstado(id, nuevoEstado).subscribe({
        next: () => {
            // Recargar datos (o solo el array de tareas) para reflejar el cambio
            this.cargarDatos();
        },
        error: (err) => console.error('Error al cambiar estado:', err)
    });
  }
}
