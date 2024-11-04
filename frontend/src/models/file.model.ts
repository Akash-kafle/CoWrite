// models/file.model.ts
export interface FileChange {
    userId: string;
    fileId: string;
    content: string;
    timestamp: Date;
    changeType: 'update' | 'delete' | 'create';
  }
  
  export interface CollaborativeFile {
    id: string;
    name: string;
    content: string;
    lastModified: Date;
    activeUsers: string[];
  }