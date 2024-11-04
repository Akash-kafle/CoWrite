import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../config/environment';
import { CollaborativeFile } from '../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFile(fileId: string) {
    return this.http.get<CollaborativeFile>(`${this.apiUrl}/files/${fileId}`);
  }

  updateFile(fileId: string, content: string) {
    return this.http.put(`${this.apiUrl}/files/${fileId}`, { content });
  }

  getActiveUsers(fileId: string) {
    return this.http.get<string[]>(`${this.apiUrl}/files/${fileId}/users`);
  }
}
