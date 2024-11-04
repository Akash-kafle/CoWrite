// services/websocket.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, Observable, of } from 'rxjs';
import { environment } from '../config/environment';
import { isPlatformBrowser } from '@angular/common';

export interface FileChange {
  userId: string;
  fileId: string;
  content: string;
  timestamp: Date;
  changeType: 'update' | 'delete' | 'create';
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$?: WebSocketSubject<any>;
  private fileChanges$ = new Subject<FileChange>();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      this.initializeWebSocket();
    }
  }

  private initializeWebSocket() {
    if (!this.isBrowser) return;

    this.socket$ = webSocket({
      url: environment.apiUrl,
      openObserver: {
        next: () => {
          console.log('WebSocket connection established');
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed');
          // Optionally implement reconnection logic here
          setTimeout(() => this.initializeWebSocket(), 5000);
        }
      }
    });

    this.socket$.subscribe(
      (message) => this.handleMessage(message),
      (error) => console.error('WebSocket error:', error)
    );
  }

  private handleMessage(message: any) {
    if (message.type === 'fileChange') {
      this.fileChanges$.next(message.data);
    }
  }

  sendChange(change: FileChange): void {
    if (!this.isBrowser || !this.socket$) return;

    this.socket$.next({
      type: 'fileChange',
      data: change
    });
  }

  getFileChanges(): Observable<FileChange> {
    if (!this.isBrowser) {
      return of(); // Return empty observable for SSR
    }
    return this.fileChanges$.asObservable();
  }

  joinFileSession(fileId: string, userId: string): void {
    if (!this.isBrowser || !this.socket$) return;

    this.socket$.next({
      type: 'joinFile',
      data: { fileId, userId }
    });
  }

  leaveFileSession(fileId: string, userId: string): void {
    if (!this.isBrowser || !this.socket$) return;

    this.socket$.next({
      type: 'leaveFile',
      data: { fileId, userId }
    });
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
  }
}