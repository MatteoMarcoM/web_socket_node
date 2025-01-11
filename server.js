const WebSocket = require('ws');

// Crea un server WebSocket sulla porta 8080
const wss = new WebSocket.Server({ port: 8080 });

// Mappatura per tenere traccia dei peer e delle loro connessioni
const peers = {};

// Funzione per decodificare il payload da Base64 e convertirlo in JSON
function decodeBase64Payload(base64String, sourcePeer, targetPeer) {
  try {
    const decodedString = Buffer.from(base64String, 'base64').toString('utf-8');
    const json = JSON.parse(decodedString);
    console.log(`Payload decodificato da Base64 (sourcePeer: ${sourcePeer}, targetPeer: ${targetPeer}):`, json);
    return json;
  } catch (error) {
    console.error(`Errore nella decodifica del payload Base64 (sourcePeer: ${sourcePeer}, targetPeer: ${targetPeer}):`, error.message);
    return null;
  }
}

wss.on('connection', (ws) => {
  console.log('Nuovo peer connesso');
  let peerId = null;

  // Quando il server riceve un messaggio
  ws.on('message', (message) => {
    const textMessage = message.toString(); // Decodifica il messaggio come stringa
    console.log('Messaggio ricevuto:', textMessage);

    if (!peerId) {
      // Il primo messaggio è considerato l'ID del peer
      peerId = textMessage;
      peers[peerId] = ws; // Associa l'ID del peer alla connessione WebSocket
      console.log(`Peer registrato con ID: ${peerId}`);
    } else {
      try {
        const parsedMessage = JSON.parse(message); // Tenta di analizzare il messaggio come JSON
        const { sourcePeer, targetPeer, payload } = parsedMessage;

        // Decodifica e mostra il payload se presente
        if (payload) {
          const decodedPayload = decodeBase64Payload(payload, sourcePeer, targetPeer);
          if (!decodedPayload) {
            ws.send(JSON.stringify({ error: 'Errore nella decodifica del payload Base64.' }));
            return;
          }
        }

        // Controlla che il peer target sia connesso
        if (peers[targetPeer]) {
          // Invia il messaggio nel formato corretto
          const forwardedMessage = {
            sourcePeer: sourcePeer,
            targetPeer: targetPeer,
            payload: payload, // Il payload dovrebbe essere una stringa Base64
          };

          peers[targetPeer].send(JSON.stringify(forwardedMessage));
        } else {
          ws.send(JSON.stringify({ error: `Il peer ${targetPeer} non è connesso.` }));
        }
      } catch (error) {
        ws.send(JSON.stringify({ error: 'Formato del messaggio non valido.' }));
      }
    }
  });

  // Gestisce la disconnessione del peer
  ws.on('close', () => {
    if (peerId) {
      delete peers[peerId]; // Rimuove il peer disconnesso
      console.log(`Peer ${peerId} disconnesso.`);
    }
  });
});

console.log("Server WebSocket in ascolto sulla porta 8080...");
