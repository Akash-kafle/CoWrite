// app.routes.ts
import { Routes } from '@angular/router';
import { CollaborativeEditorComponent } from './components/editor.component';

export const routes: Routes = [
  { path: '', redirectTo: 'editor', pathMatch: 'full' },
  { path: 'editor', component: CollaborativeEditorComponent },
  { path: 'editor/:id', component: CollaborativeEditorComponent }
];