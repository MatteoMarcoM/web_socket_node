const WebSocket = require('ws');

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Mapping to keep track of peers and their connections
const peers = {};

// Function to decode Base64 payload and convert it to JSON
function decodeBase64Payload(base64String, sourcePeer, targetPeer) {
  try {
    const decodedString = Buffer.from(base64String, 'base64').toString('utf-8');
    const json = JSON.parse(decodedString);
    console.log(`Decoded Base64 payload (sourcePeer: ${sourcePeer}, targetPeer: ${targetPeer}):`, json);
    return json;
  } catch (error) {
    console.error(`Error decoding Base64 payload (sourcePeer: ${sourcePeer}, targetPeer: ${targetPeer}):`, error.message);
    return null;
  }
}

wss.on('connection', (ws) => {
  console.log('New peer connected');
  let peerId = null;

  // When server receives a message
  ws.on('message', (message) => {
    const textMessage = message.toString(); // Decode message as string
    console.log('Message received:', textMessage);

    if (!peerId) {
      // First message is considered as peer ID
      peerId = textMessage;
      peers[peerId] = ws; // Associate peer ID with WebSocket connection
      console.log(`Peer registered with ID: ${peerId}`);
    } else {
      try {
        const parsedMessage = JSON.parse(message); // Try to parse message as JSON
        const { sourcePeer, targetPeer, payload } = parsedMessage;

        // Decode and display payload if present
        if (payload) {
          const decodedPayload = decodeBase64Payload(payload, sourcePeer, targetPeer);
          if (!decodedPayload) {
            ws.send(JSON.stringify({ error: 'Error decoding Base64 payload.' }));
            return;
          }
        }

        // Check if target peer is connected
        if (peers[targetPeer]) {
          // Send message in correct format
          const forwardedMessage = {
            sourcePeer: sourcePeer,
            targetPeer: targetPeer,
            payload: payload, // Payload should be a Base64 string
          };

          peers[targetPeer].send(JSON.stringify(forwardedMessage));
        } else {
          ws.send(JSON.stringify({ error: `Peer ${targetPeer} is not connected.` }));
        }
      } catch (error) {
        ws.send(JSON.stringify({ error: 'Invalid message format.' }));
      }
    }
  });

  // Handle peer disconnection
  ws.on('close', () => {
    if (peerId) {
      delete peers[peerId]; // Remove disconnected peer
      console.log(`Peer ${peerId} disconnected.`);
    }
  });
});

console.log("WebSocket Server listening on port 8080...");
