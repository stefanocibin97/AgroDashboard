import express from 'express'; //Framework per la creazione di API web.
import { createServer } from 'http'; //Modulo nativo di Node.js per creare un server HTTP.
import { Server } from 'socket.io'; //Libreria per la comunicazione in tempo reale tra client e server.
import cors from 'cors'; //Middleware per gestire le richieste CORS (Cross-Origin Resource Sharing).
import { SimulatoreAmbientale } from './simulatore.js'; //Classe per la simulazione ambientale.

// Inizializza un server WebSocket con socket.io, abilitando il CORS per consentire connessioni dal frontend 
const applicazione = express();
const serverHttp = createServer(applicazione);
const io = new Server(serverHttp, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware per gestire le richieste CORS
applicazione.use(cors());

// Root di base per testare il server
applicazione.get('/', (richiesta, risposta) => {
  risposta.send('Il server è in esecuzione');
});

// Inizializza il simulatore ambientale e crea un intervallo per inviare dati ai client connessi 
// Se non ci sono client connessi, l'intervallo viene fermato per risparmiare risorse e viene riavviato 
// quando un nuovo client si connette
const simulatore = new SimulatoreAmbientale();
let idIntervallo = null;

io.on('connection', (socket) => {

  // Se non c'è già un intervallo attivo, crea un nuovo intervallo per inviare dati ai client
  if (!idIntervallo) {
    idIntervallo = setInterval(() => {
      // Avanza al prossimo passo temporale
      simulatore.avanzaPassoTempo();

      // Genera i dati aggiornati
      const datiAmbientali = simulatore.generaDatiAmbientali();
      const datiProduzione = simulatore.generaDatiProduzione();
      const datiSostenibilità = simulatore.generaDatiSostenibilita();
      const getDatiIrrigazione = simulatore.getDatiIrrigazione();
      const avviso = simulatore.generaAvviso();

      // Invia i dati a tutti i client connessi
      io.emit('dati-ambientali', datiAmbientali);
      io.emit('dati-produzione', datiProduzione);
      io.emit('dati-sostenibilita', datiSostenibilità);
      io.emit('dati-irrigazione', getDatiIrrigazione);
      if (avviso) {
        io.emit('avviso', avviso);
      }
    }, 3000); // Aggiorna ogni 3 secondi
  }

  socket.on('disconnect', () => {
    // Se non ci sono più client connessi, ferma l'intervallo
    if (io.engine.clientsCount === 0 && idIntervallo) {
      clearInterval(idIntervallo);
      idIntervallo = null;
    }
  });
});

// Avvia il server HTTP sulla porta specificata nell'ambiente o sulla porta 3000 di default
const PORTA = 3000;
serverHttp.listen(PORTA, () => {
  console.log(`Server in esecuzione sulla porta ${PORTA}`);
});