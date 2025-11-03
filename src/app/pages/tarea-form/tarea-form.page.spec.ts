import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareaFormPage } from './tarea-form.page';

describe('TareaFormPage', () => {
  let component: TareaFormPage;
  let fixture: ComponentFixture<TareaFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TareaFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
