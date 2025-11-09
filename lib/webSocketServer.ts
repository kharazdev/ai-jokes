// lib/webSocketServer.ts
import { WebSocketServer, WebSocket } from 'ws';
import EventEmitter from 'eventemitter3';

// --- START: THE CORRECTED SINGLETON FIX ---

// Use 'var' to declare a variable in the global scope for TypeScript.
// This is a standard and safe way to create a global singleton in a module environment.
declare var global: {
  _emitter: EventEmitter;
  _clients: Map<string, WebSocket>;
};

// If the emitter doesn't exist on the global object, create it. Otherwise, use the existing one.
if (!global._emitter) {
  global._emitter = new EventEmitter();
}
if (!global._clients) {
  global._clients = new Map<string, WebSocket>();
}

// Export the single, global instances.
export const serverEvents = global._emitter;
const activeClients = global._clients;
// --- END: THE CORRECTED SINGLETON FIX ---


export const configureWebSocketServer = (wss: WebSocketServer) => {
  console.log('✅ WebSocket Server logic is configured.');

  wss.on('connection', (ws) => {
    console.log('🚀 A client has connected to /api/ws path!');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'REGISTER' && data.jobId) {
          console.log(`WebSocket client registered for Job ID: ${data.jobId}`);
          activeClients.set(data.jobId, ws); // Use the global activeClients
        }
      } catch (e) { /* ... */ }
    });

    ws.on('close', () => {
      activeClients.forEach((socket, jobId) => { // Use the global activeClients
        if (socket === ws) {
          activeClients.delete(jobId);
          console.log(`WebSocket client for Job ID ${jobId} disconnected.`);
        }
      });
    });
  });

  // This will now listen on the one true global emitter
  serverEvents.on('job-done', ({ jobId, jokes }) => {
    const client = activeClients.get(jobId);
    if (client && client.readyState === WebSocket.OPEN) {
      console.log(`✅ Job ${jobId} is done. Sending results to client via global emitter.`);
      client.send(JSON.stringify({ type: 'JOB_COMPLETE', payload: jokes }));
      client.close();
      activeClients.delete(jobId);
    } else {
      console.log(`❌ Could not find active client for Job ID: ${jobId}`);
    }
  });
};