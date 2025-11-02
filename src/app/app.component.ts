// src/app/app.component.ts
import { Component } from '@angular/core';
import { 
  IonApp, 
  IonRouterOutlet,
  // Nuevos imports para el menú
  IonMenu, 
  IonList, 
  IonMenuToggle, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonItem,
  IonIcon,
  IonLabel
} from '@ionic/angular/standalone';
// Importa íconos que usarás en el menú
import { listOutline, settingsOutline, homeOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

// Agrega los íconos
addIcons({ listOutline, settingsOutline, homeOutline });

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  // Agrega los nuevos componentes a la lista de imports
  imports: [
    IonApp, 
    IonRouterOutlet,
    IonMenu, 
    IonList, 
    IonMenuToggle, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonItem,
    IonIcon,
    IonLabel,
    RouterLink,
    CommonModule
  ],
})
export class AppComponent {

  // LISTA ACTUALIZADA CON LAS RUTAS DEL MENÚ
  public appPages = [
    { title: 'Tablero', url: '/tablero', icon: 'listOutline' }, // Apunta a /tasks (Tu tablero)
    { title: 'Inbox', url: '/inbox', icon: 'homeOutline' }, // Asumo que Inbox usa la ruta /home
  ];
  
  constructor() {}
}