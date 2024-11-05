// app.routes.ts
import { Routes } from '@angular/router';
import { CollaborativeEditorComponent } from './components/editor.component';

export const routes: Routes = [
  { path: 'editor/:id', component: CollaborativeEditorComponent }
];