// services/websocket.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Subject, Observable, of } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { isPlatformBrowser } from '@angular/common';
import { FileChange } from '../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | undefined;
  private fileChanges$ = new Subject<FileChange>();
  private userJoined$ = new Subject<{userId: string, fileId: string}>();
  private userLeft$ = new Subject<{userId: string, fileId: string}>();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      this.initializeSocket();
    }
  }

  private initializeSocket() {
    if (!this.isBrowser) return;

    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('fileChange', (change: FileChange) => {
      this.fileChanges$.next(change);
    });

    this.socket.on('userJoined', (data: {userId: string, fileId: string}) => {
      this.userJoined$.next(data);
    });

    this.socket.on('userLeft', (data: {userId: string, fileId: string}) => {
      this.userLeft$.next(data);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  sendChange(change: FileChange): void {
    if (!this.isBrowser || !this.socket?.connected) {
      console.warn('Cannot send change: Socket not connected');
      return;
    }

    this.socket.emit('fileChange', change);
  }

  getFileChanges(): Observable<FileChange> {
    return this.fileChanges$.asObservable();
  }

  getUserJoined(): Observable<{userId: string, fileId: string}> {
    return this.userJoined$.asObservable();
  }

  getUserLeft(): Observable<{userId: string, fileId: string}> {
    return this.userLeft$.asObservable();
  }

  joinFileSession(fileId: string, userId: string): void {
    if (!this.isBrowser || !this.socket?.connected) return;
    this.socket.emit('joinFile', { fileId, userId });
  }

  leaveFileSession(fileId: string, userId: string): void {
    if (!this.isBrowser || !this.socket?.connected) return;
    this.socket.emit('leaveFile', { fileId, userId });
  }

  disconnect(): void {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
  }
}