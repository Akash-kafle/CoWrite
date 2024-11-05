// models/file.model.ts
export interface CollaborativeFile {
  id: string;
  name: string;
  content: string;
  activeUsers: ActiveUser[];
  lastModified?: Date;
  createdBy?: string;
}

export interface FileChange {
  userId: string;
  fileId: string;
  content: string;
  timestamp: Date;
  changeType: 'update' | 'delete' | 'create';
}

export interface FileUser {
  id: string;
  name: string;
  color?: string;
}

export interface ActiveUser {
  name: string;
}