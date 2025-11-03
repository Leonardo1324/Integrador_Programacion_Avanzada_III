import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController, LoadingController } from '@ionic/angular';
import { TareasService, Estado, Tarea } from '../../services/tareas';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonLabel, IonContent, IonSpinner, IonList, IonText, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption, IonFooter } from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tarea-form',
  templateUrl: './tarea-form.page.html',
  styleUrls: ['./tarea-form.page.scss'],
  imports: [IonHeader, CommonModule,ReactiveFormsModule, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonLabel, IonContent, IonSpinner, IonList, IonText, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption, IonFooter],
})
export class TareaFormPage implements OnInit {

  taskForm!: FormGroup;
  taskId!: number;
  modo: 'crear' | 'editar' = 'crear';
  estadosDisponibles: Estado[] = [];
  isLoading = false;
  pageTitle = 'Nueva tarea';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private tareasService: TareasService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    // Inicializamos el formulario
    this.taskForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      estado: ['', Validators.required],
      asignadoA: ['']
    });

    // Cargar estados disponibles
    this.tareasService.obtenerEstados().subscribe(estados => this.estadosDisponibles = estados);

    // Leer parámetros
    this.route.queryParams.subscribe(params => {
      this.modo = params['modo'] || 'crear';
      this.taskId = params['id'];

      if (this.modo === 'editar' && this.taskId) {
        this.cargarTarea();
        this.pageTitle = 'Editar tarea';
      } else {
        this.pageTitle = 'Nueva tarea';
      }
    });
  }

  get f() {
    return this.taskForm.controls;
  }

  async cargarTarea() {
    this.isLoading = true;
    this.tareasService.obtenerTareaPorId(this.taskId).subscribe({
      next: (tarea) => {
        this.taskForm.patchValue(tarea);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar tarea:', err);
        this.isLoading = false;
      }
    });
  }

  async guardarTarea() {
    if (this.taskForm.invalid) return;

    const tareaData = this.taskForm.value as Tarea;
    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    const accion$ = this.modo === 'editar'
      ? this.tareasService.actualizarTarea(this.taskId, tareaData)
      : this.tareasService.agregarTarea(tareaData.titulo,
  tareaData.descripcion,
  tareaData.estado);
      

    accion$.subscribe({
      next: async () => {
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: this.modo === 'editar' ? 'Tarea actualizada' : 'Tarea creada',
          duration: 2000,
          color: 'success'
        });
        toast.present();
        this.navCtrl.navigateBack('/tablero');
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error al guardar tarea:', err);
        const toast = await this.toastCtrl.create({
          message: 'Error al guardar tarea',
          duration: 2000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }
}
