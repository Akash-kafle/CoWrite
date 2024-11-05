const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// In-memory storage (replace with database in production)
const files = new Map();
const activeUsers = new Map();

// API Routes
app.get('/api/files/:id', (req, res) => {
    const file = files.get(req.params.id);
    if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
    }
    res.json(file);
});

app.patch('/api/files/:id', (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    
    const file = files.get(id);
    if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
    }

    file.content = content;
    file.lastModified = new Date();
    files.set(id, file);
    
    res.json(file);
});

app.post('/api/files', (req, res) => {
    const file = {
        id: Math.random().toString(36).substr(2, 9),
        ...req.body,
        createdAt: new Date(),
        lastModified: new Date()
    };
    files.set(file.id, file);
    res.json(file);
});

// WebSocket handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('fileChange', (change) => {
        const file = files.get(change.fileId);
        if (file) {
            file.content = change.content;
            file.lastModified = new Date();
            files.set(change.fileId, file);
        }
        
        socket.to(change.fileId).emit('fileChange', change);
    });

    socket.on('joinFile', ({ fileId, userId }) => {
        socket.join(fileId);
        
        if (!activeUsers.has(fileId)) {
            activeUsers.set(fileId, new Set());
        }
        activeUsers.get(fileId).add(userId);
        
        // Update file with active users
        const file = files.get(fileId);
        if (file) {
            file.activeUsers = Array.from(activeUsers.get(fileId));
            files.set(fileId, file);
        }
        
        io.to(fileId).emit('userJoined', { userId, fileId });
    });

    socket.on('leaveFile', ({ fileId, userId }) => {
        socket.leave(fileId);
        
        if (activeUsers.has(fileId)) {
            activeUsers.get(fileId).delete(userId);
            if (activeUsers.get(fileId).size === 0) {
                activeUsers.delete(fileId);
            }
            
            // Update file with active users
            const file = files.get(fileId);
            if (file) {
                file.activeUsers = Array.from(activeUsers.get(fileId) || []);
                files.set(fileId, file);
            }
            
            io.to(fileId).emit('userLeft', { userId, fileId });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});