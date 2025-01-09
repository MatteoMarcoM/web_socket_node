const WebSocket = require('ws');

// Crea un server WebSocket sulla porta 8080
const wss = new WebSocket.Server({ port: 8080 });

// Mappatura per tenere traccia dei peer e delle loro connessioni
const peers = {};

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
      
          // Controlla che il peer target sia connesso
          if (peers[targetPeer]) {
            peers[targetPeer].send(JSON.stringify({ from: sourcePeer, data: payload }));
          } else {
            ws.send(`Errore: Il peer ${targetPeer} non è connesso.`);
          }
        } catch (error) {
          ws.send('Errore: Formato del messaggio non valido.');
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
