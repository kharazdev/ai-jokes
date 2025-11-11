// lib/webSocketServer.ts
import { WebSocketServer, WebSocket } from 'ws';
import EventEmitter from 'eventemitter3';

// --- START: SINGLETON PATTERN ---
// This part is correct and does not need changes. It ensures a single
// instance of the emitter and client map across your application.
declare var global: {
  _emitter: EventEmitter;
  _clients: Map<string, WebSocket>;
};

if (!global._emitter) {
  global._emitter = new EventEmitter();
}
if (!global._clients) {
  global._clients = new Map<string, WebSocket>();
}

export const serverEvents = global._emitter;
const activeClients = global._clients;
// --- END: SINGLETON PATTERN ---


export const configureWebSocketServer = (wss: WebSocketServer) => {
  console.log('✅ WebSocket Server logic is configured.');

  wss.on('connection', (ws) => {
    console.log('🚀 A client has connected to the /api/ws path!');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'REGISTER' && data.jobId) {
          console.log(`WebSocket client registered for Job ID: ${data.jobId}`);
          activeClients.set(data.jobId, ws);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    });

    ws.on('close', () => {
      // Find and remove the client from the map when it disconnects
      activeClients.forEach((socket, jobId) => {
        if (socket === ws) {
          activeClients.delete(jobId);
          console.log(`WebSocket client for Job ID ${jobId} disconnected.`);
        }
      });
    });
  });

  // --- NEW: LISTEN FOR JOB PROGRESS ---
  // This listener forwards progress updates from the backend job to the client.
  serverEvents.on('job-progress', ({ jobId, message }) => {
    const client = activeClients.get(jobId);
    if (client && client.readyState === WebSocket.OPEN) {
      console.log(`[Progress Update] Sending to Job ID ${jobId}: ${message}`);
      client.send(JSON.stringify({
        type: 'JOB_PROGRESS',
        payload: { message }
      }));
    }
  });

  // --- UPDATED: LISTEN FOR JOB COMPLETION ---
  // This listener sends the final successful result to the client.
  serverEvents.on('job-done', ({ jobId, jokes }) => {
    const client = activeClients.get(jobId);
    if (client && client.readyState === WebSocket.OPEN) {
      console.log(`✅ Job ${jobId} is done. Sending results to the client.`);
      client.send(JSON.stringify({ type: 'JOB_COMPLETE', payload: jokes }));
      // Clean up the connection
      client.close();
      activeClients.delete(jobId);
    } else {
      console.log(`❌ Could not find an active client for completed Job ID: ${jobId}`);
    }
  });

  // --- NEW: LISTEN FOR JOB ERRORS ---
  // This listener forwards error messages to the client when a job fails.
  serverEvents.on('job-error', ({ jobId, message }) => {
    const client = activeClients.get(jobId);
    if (client && client.readyState === WebSocket.OPEN) {
      console.error(`❌ Job ${jobId} failed. Sending error to the client: ${message}`);
      client.send(JSON.stringify({
        type: 'JOB_ERROR',
        payload: { message }
      }));
      // Clean up the connection
      client.close();
      activeClients.delete(jobId);
    } else {
      console.log(`❌ Could not find an active client for failed Job ID: ${jobId}`);
    }
  });
};