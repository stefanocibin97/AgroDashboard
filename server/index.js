import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { EnvironmentalSimulator } from './simulator.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Serve a basic response for the root route
app.get('/', (req, res) => {
  res.send('Server is running');
});

const simulator = new EnvironmentalSimulator();
let intervalId = null;

io.on('connection', (socket) => {
  console.log('Client connected');

  // Se non c'è già un intervallo attivo, ne creiamo uno nuovo
  if (!intervalId) {
    intervalId = setInterval(() => {
      const environmentalData = simulator.generateEnvironmentalData();
      const productionData = simulator.generateProductionData();
      const sustainabilityData = simulator.generateSustainabilityData();
      const alert = simulator.generateAlert();

      // Invia i dati a tutti i client connessi
      io.emit('environmental-data', environmentalData);
      io.emit('production-data', productionData);
      io.emit('sustainability-data', sustainabilityData);
      if (alert) {
        io.emit('alert', alert);
      }
    }, 3000); // Aggiorna ogni 3 secondi
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Se non ci sono più client connessi, fermiamo l'intervallo
    if (io.engine.clientsCount === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});