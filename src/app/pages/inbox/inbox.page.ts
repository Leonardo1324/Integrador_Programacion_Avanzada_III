import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TareasService, Tarea } from '../../services/tareas';
import { IonContent, IonList, IonItem, IonLabel, IonSelectOption, IonSelect, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonMenuButton } from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.page.html',
  styleUrls: ['./inbox.page.scss'],
  imports: [IonContent, CommonModule, IonList, IonItem, IonLabel, IonSelectOption, IonSelect, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonMenuButton],
})
export class InboxPage {
  tareas: Tarea[] = [];

  constructor(private tareasService: TareasService, private alertCtrl: AlertController) {}

  ionViewWillEnter() {
    this.tareas = this.tareasService.obtenerTareas();
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
            if (data.titulo) {
              this.tareasService.agregarTarea(data.titulo);
              this.tareas = this.tareasService.obtenerTareas();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  cambiarEstado(id: number, nuevoEstado: any) {
    this.tareasService.cambiarEstado(id, nuevoEstado);
  }
}
