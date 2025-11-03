import { Component } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { finalize, forkJoin } from 'rxjs';
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
  IonMenuButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.page.html',
  styleUrls: ['./inbox.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonMenuButton,
    IonIcon,
    IonSpinner,
  ],
})
export class InboxPage {
  tareas: Tarea[] = [];
  estadosDisponibles: Estado[] = [];
  isLoading = false;

  constructor(
    private tareasService: TareasService,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private auth: AuthService
  ) {}

  ionViewWillEnter() {
    this.cargarDatos();
  }

 cargarDatos() {
  this.isLoading = true;
  const usuarioActual = this.auth.getUsuario();

  forkJoin({
    tareas: this.tareasService.obtenerTareas(),
    estados: this.tareasService.obtenerEstados(),
  })
    .pipe(finalize(() => (this.isLoading = false)))
    .subscribe({
      next: (results) => {
        this.tareas = results.tareas.filter(
          (t) => !usuarioActual || t.asignadoA?.toLowerCase() === usuarioActual.toLowerCase()
        );
        this.estadosDisponibles = results.estados;
      },
      error: (err) => console.error('Error al cargar datos del Inbox:', err),
    });
}

  agregarTarea(estado: string) {
    this.navCtrl.navigateForward(['/tarea-form'], {
      queryParams: { estado, modo: 'crear' },
    });
  }

  editarTarea(id: number) {
    this.navCtrl.navigateForward(['/tarea-form'], {
      queryParams: { id, modo: 'editar' },
    });
  }

  cambiarEstado(id: number, nuevoEstado: Tarea['estado']) {
    this.tareasService.cambiarEstado(id, nuevoEstado).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => console.error('Error al cambiar estado:', err),
    });
  }

  async confirmarEliminar(id: number) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar tarea',
      message: '¿Estás seguro de que deseas eliminar esta tarea?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminarTarea(id),
        },
      ],
    });

    await alert.present();
  }

  eliminarTarea(id: number) {
    this.tareasService.eliminarTarea(id).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => console.error('Error al eliminar tarea:', err),
    });
  }

  logout() {
  this.auth.logout();
  this.navCtrl.navigateRoot(['/login']);
}

}
