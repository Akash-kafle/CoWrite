// services/file.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CollaborativeFile } from '../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:3000/api/files'; // Adjust to your API URL

  constructor(private http: HttpClient) {}

  getFile(fileId: string): Observable<CollaborativeFile> {
    return this.http.get<CollaborativeFile>(`${this.apiUrl}/${fileId}`).pipe(
      catchError(error => {
        console.error('Error fetching file:', error);
        // Return a default file if API fails
        return of({
          id: fileId,
          name: 'Untitled',
          content: '',
          activeUsers: []
        });
      })
    );
  }

  updateFile(fileId: string, content: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${fileId}`, { content }).pipe(
      catchError(error => {
        console.error('Error updating file:', error);
        return of(null);
      })
    );
  }

  createFile(file: Partial<CollaborativeFile>): Observable<CollaborativeFile> {
    return this.http.post<CollaborativeFile>(this.apiUrl, file);
  }

  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${fileId}`);
  }

  getFiles(): Observable<CollaborativeFile[]> {
    return this.http.get<CollaborativeFile[]>(this.apiUrl);
  }
}