import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject ,Input } from '@angular/core';
import { isPlatformBrowser,CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // Import FormsModule here
import { ActivatedRoute } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service';
import { FileService } from '../../services/file.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { CollaborativeFile, FileChange } from '../../models/file.model';

interface Change {
  userName: string;
  timestamp: Date;
}
@Component({
    selector: 'app-collaborative-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="flex flex-col h-screen bg-gray-50">
      <nav class="flex justify-between items-center px-6 py-3 bg-white border-b">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-semibold text-gray-800">
            {{ file?.name || 'Untitled' }}
          </h2>
          <span [class]="'text-sm px-2 py-1 rounded ' + 
            (isSaved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')">
            {{ isSaved ? 'Saved' : 'Unsaved changes' }}
          </span>
        </div>

        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600">
              {{ file?.activeUsers?.length || 0 }} active
            </span>
            <div class="flex -space-x-2">
              <div
                *ngFor="let user of file?.activeUsers"
                [title]="user.name"
                class="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm border-2 border-white"
              >
                {{ user.name[0] }}
              </div>
            </div>
          </div>
          <button
            (click)="handleSave()"
            [disabled]="isSaved"
            class="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </nav>

      <main class="flex flex-1 overflow-hidden">
        <div class="flex-1 p-4">
          <div class="h-full bg-white rounded-lg shadow">
            <textarea
              class="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
              [ngModel]="file?.content"
              (ngModelChange)="onContentChange($event)"
              [disabled]="!file || isLoading"
              [placeholder]="isLoading ? 'Loading...' : 'Start typing...'"
              [spellcheck]="false"
            ></textarea>
          </div>
        </div>

        <div class="w-60 bg-white border-l p-4">
          <h3 class="font-medium text-gray-700 mb-4">Recent Changes</h3>
          <div class="space-y-2">
            <div
              *ngFor="let change of recentChanges"
              class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
            >
              <span class="font-medium text-gray-700">{{ change.userName }}</span>
              <span class="text-gray-500">
                {{ change.timestamp | date:'shortTime' }}
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer class="flex gap-6 px-6 py-2 bg-white border-t text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <span class="font-medium">Characters:</span>
          {{ file?.content?.length || 0 }}
        </div>
        <div class="flex items-center gap-2">
          <span class="font-medium">Last saved:</span>
          {{ lastSaved | date:'medium' || 'Never' }}
        </div>
      </footer>

      <div *ngIf="isLoading" 
           class="fixed inset-0 bg-white/90 flex flex-col items-center justify-center gap-4">
        <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading document...</span>
      </div>
    </div>
  `,
})
export class CollaborativeEditorComponent implements OnInit, OnDestroy {
  file: CollaborativeFile | null = null;
  isLoading = true;
  isSaved = true;
  lastSaved: Date | null = null;
  recentChanges: Change[] = [];
  private destroy$ = new Subject<void>();
  private contentChanges$ = new Subject<string>();
  private userId = 'user-' + Math.random().toString(36).substr(2, 9);
  isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
      private wsService: WebSocketService,
      private fileService: FileService,
      @Inject(PLATFORM_ID) platformId: Object
  ) {      this.isBrowser = isPlatformBrowser(platformId);
  }

  
  
    ngOnInit() {
      if (!this.isBrowser) return;
  
      const fileId = this.route.snapshot.paramMap.get('id');
      if (!fileId) return;
  
      this.wsService.joinFileSession(fileId, this.userId);
  
      this.fileService.getFile(fileId).subscribe(file => {
        this.file = file;
      });
  
      this.wsService.getFileChanges()
        .pipe(takeUntil(this.destroy$))
        .subscribe(change => {
          if (change.userId !== this.userId) {
            this.file = {
              ...this.file!,
              content: change.content
            };
          }
        });
  
      this.contentChanges$
        .pipe(
          debounceTime(500),
          takeUntil(this.destroy$)
        )
        .subscribe(content => {
          if (!fileId) return;
          
          const change: FileChange = {
            userId: this.userId,
            fileId,
            content,
            timestamp: new Date(),
            changeType: 'update'
          };
          
          this.wsService.sendChange(change);
          this.fileService.updateFile(fileId, content).subscribe();
        });
    }

    onContentChange(content: string) {
      if (this.file) {
        this.file = {
          ...this.file,
          content
        };
        this.isSaved = false;
        this.contentChanges$.next(content);
      }
    }
  
    handleSave() {
      // Simulate save operation
      this.isSaved = true;
      this.lastSaved = new Date();
      this.recentChanges = [
        { userName: 'You', timestamp: new Date() },
        ...this.recentChanges.slice(0, 4)
      ];
    }
  
    ngOnDestroy() {
      this.destroy$.next();
      this.destroy$.complete();
    }
}

