import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CollaborativeEditorComponent } from './components/editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CollaborativeEditorComponent],
  template: `
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.less'
})
export class AppComponent {
  title = 'frontend';
}