import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service';
import { FileService } from '../../services/file.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { CollaborativeFile, FileChange } from '../../models/file.model';

@Component({
    selector: 'app-collaborative-editor',
    standalone: true,
    template: `
      <div class="editor-container">
        <div class="header">
          <h2>{{ file?.name }}</h2>
          <div class="active-users">
            Active Users: {{ file?.activeUsers?.length || 0 }}
          </div>
        </div>
        <textarea
          [value]="file?.content"
          (input)="onContentChange($event)"
          class="editor"
          [attr.disabled]="!isBrowser"
        ></textarea>
      </div>
    `,
  styles: [`
    .editor-container {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      display: flex;
      justify-content: space-between;
      padding: 1rem;
      background: #f5f5f5;
    }
    .editor {
      flex: 1;
      padding: 1rem;
      font-family: monospace;
      font-size: 14px;
      border: none;
      resize: none;
    }
  `]
})
export class CollaborativeEditorComponent implements OnInit, OnDestroy {
    file: CollaborativeFile | null = null;
    private destroy$ = new Subject<void>();
    private contentChanges$ = new Subject<string>();
    private userId = 'user-' + Math.random().toString(36).substr(2, 9);
    isBrowser: boolean;
  
    constructor(
      private route: ActivatedRoute,
      private wsService: WebSocketService,
      private fileService: FileService,
      @Inject(PLATFORM_ID) platformId: Object
    ) {
      this.isBrowser = isPlatformBrowser(platformId);
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

  onContentChange(event: Event) {
    const content = (event.target as HTMLTextAreaElement).value;
    this.file = {
      ...this.file!,
      content
    };
    this.contentChanges$.next(content);
  }

  ngOnDestroy() {
    const fileId = this.route.snapshot.paramMap.get('id');
    if (fileId) {
      this.wsService.leaveFileSession(fileId, this.userId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}

