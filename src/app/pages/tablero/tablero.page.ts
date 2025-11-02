import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TareasService, Tarea } from '../../services/tareas';
import { IonButton, IonIcon, IonCardContent, IonCard, IonCardTitle, IonCardHeader, IonHeader, IonToolbar, IonTitle, IonButtons, IonLabel, IonContent, IonMenuButton } from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.page.html',
  styleUrls: ['./tablero.page.scss'],
  imports: [
    IonButton, CommonModule, DragDropModule, IonIcon, IonCardContent, IonCard,
    IonCardTitle, IonCardHeader, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonLabel, IonContent,
    IonMenuButton
],
})
export class TableroPage {
  estados = [
    { clave: 'por_hacer', titulo: 'Por hacer' },
    { clave: 'en_progreso', titulo: 'En progreso' },
    { clave: 'completado', titulo: 'Completado' },
  ];

  columnasConectadas: string[] = [];
  tareas: Tarea[] = [];

  constructor(private tareasService: TareasService, private alertCtrl: AlertController) {}

  ionViewWillEnter() {
    this.tareas = this.tareasService.obtenerTareas();
    this.actualizarColumnasConectadas();
  }

  actualizarColumnasConectadas() {
    this.columnasConectadas = this.estados.map(e => e.clave);
  }

  obtenerTareasPorEstado(estado: string) {
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
              const clave = data.nombre.toLowerCase().replace(/\s+/g, '_');
              this.estados.push({ clave, titulo: data.nombre });
              this.actualizarColumnasConectadas();
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
      message: `¿Seguro que deseas eliminar la columna <b>${columna.titulo}</b> y todas sus tareas?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            // Eliminar tareas asociadas a esta columna
            this.tareas = this.tareas.filter(t => t.estado !== clave);
            // Eliminar la columna
            this.estados = this.estados.filter(e => e.clave !== clave);
            this.actualizarColumnasConectadas();
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
              this.tareasService.agregarTarea(data.titulo);
              const nueva = this.tareasService.obtenerTareas().slice(-1)[0];
              nueva.estado = estado;
              this.tareas = this.tareasService.obtenerTareas();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  // 🟠 Mover tareas
  dropTarea(event: CdkDragDrop<Tarea[]>, nuevoEstado: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const tarea = event.previousContainer.data[event.previousIndex];
      tarea.estado = nuevoEstado;
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  // 🔵 Mover columnas
  dropColumna(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.estados, event.previousIndex, event.currentIndex);
    this.actualizarColumnasConectadas();
  }
}
