import { addHours, format, getMonth } from 'date-fns';

export class SimulatoreAmbientale {
  constructor() {
    this.passoTempo = 0;
    this.memoriaUmiditàSuolo = [];
    this.datiAmbientaliCorrenti = null;
    this.resetSimulazione();
  }

  avanzaPassoTempo() {
    this.passoTempo++; // Incrementa il passo temporale di un'ora
    this.datiAmbientaliCorrenti = this.generaDatiAmbientali(); // Aggiorna i dati ambientali correnti
  }

  // Questa funzione calcola un fattore stagionale basato sul mese corrente.
  // Usa la funzione getMonth(new Date()) per ottenere il mese (da 0 a 11).
  // Il calcolo utilizza una funzione sinusoidale per simulare un andamento ciclico (ad esempio, temperature più alte in estate e più basse in inverno).
  // Il risultato è un valore compreso tra 0 e 1, dove 0 rappresenta il minimo stagionale e 1 il massimo.
  getFattoreStagionale() {
    const mese = getMonth(new Date());
    return Math.sin((mese + 1) * Math.PI / 6) * 0.5 + 0.5;
  }

  // Questa funzione calcola un fattore che rappresenta il ciclo giorno-notte in base all'ora fornita.
  // oraPicco è impostato a 14 (le 14:00), che rappresenta il momento di massima luce.
  // Usa una funzione coseno per simulare l'andamento della luce durante il giorno, con un valore massimo a oraPicco e minimo durante la notte.
  // Il risultato è un valore compreso tra 0 e 1, dove 0 rappresenta il minimo (notte) e 1 il massimo (giorno).
  cicloGiornoNotte(ora) {
    const oraPicco = 14;
    const fase = ((ora - oraPicco + 24) % 24) * Math.PI / 12;
    return Math.cos(fase) * 0.5 + 0.5;
  }

  // Questa funzione aggiorna la tendenza meteorologica con una probabilità del 10% (Math.random() < 0.1).
  // Se la tendenza viene aggiornata, sceglie casualmente uno dei tre valori: 'stable', 'in miglioramento' o 'in peggioramento'.
  // La tendenza meteorologica viene memorizzata nella proprietà this.tendenzaMeteorologica.
  aggiornaTendenzaMeteorologica() {
    if (Math.random() < 0.1) {
      const tendenze = ['stabile', 'in miglioramento', 'in peggioramento'];
      this.tendenzaMeteorologica = tendenze[Math.floor(Math.random() * tendenze.length)];
    }
  }

  // Questa funzione resetta i parametri della simulazione a valori di default.
  // Viene chiamata all'inizio della simulazione o quando è necessario ripristinare lo stato.
  resetSimulazione() {
    this.passoTempo = 0;
    this.fattoreStagionale = this.getFattoreStagionale();
    this.temperaturaBase = 10 + this.fattoreStagionale * 10;
    this.umiditàBase = 60 - this.fattoreStagionale * 20;
    this.velocitaVentoBase = 8 + this.fattoreStagionale * 4;
    this.efficienzaSolareBase = 85;
    this.tendenzaMeteorologica = 'stabile';
    this.ultimaPioggia = 0;
    this.memoriaUmiditàSuolo = Array(24).fill(70);
  }

  // Questa funzione calcola l'evapotraspirazione utilizzando la formula di Penman-Monteith.
  // I parametri sono temperatura (T), velocità del vento (u2), radiazione netta (Rn), flusso di calore del suolo (G),
  // pressione di vapore saturazione (es) e pressione di vapore effettiva (ea).
  // La funzione restituisce il valore di evapotraspirazione (ETo) in mm/giorno.
  calcolaEvapotraspirazione(T, u2, Rn, G, es, ea) {
    // Costanti
    const γ = 0.066; // Costante psicrometrica (kPa/°C)
    const Δ = 4098 * (0.6108 * Math.exp((17.27 * T) / (T + 237.3))) / Math.pow(T + 237.3, 2); // Pendenza della curva di pressione di vapore (kPa/°C)
  
    // Formula di Penman-Monteith
    const ETo = (0.408 * Δ * (Rn - G) + γ * (900 / (T + 273)) * u2 * (es - ea)) / (Δ + γ * (1 + 0.34 * u2));
  
    return Math.max(0, ETo);
  }

  // Questa funzione pianifica l'irrigazione in base a vari parametri.
  pianificaIrrigazione(temperatura, velocitaVento, radiazioneSolare, umidita, areaColtivata = 1000, efficienzaIrrigazione = 0.9, precipitazioni = 0, frequenzaIrrigazione = 1) {
    // Parametri di default
    const radiazioneNetta = radiazioneSolare / 100; // Conversione ipotetica in MJ/m²/giorno
    const flussoCaloreSuolo = 0; // Assumiamo che sia trascurabile
    const pressioneVaporeSaturazione = 0.6108 * Math.exp((17.27 * temperatura) / (temperatura + 237.3)); // kPa
    const pressioneVaporeEffettiva = pressioneVaporeSaturazione * (umidita / 100); // kPa
      
    // Calcolo dell'evapotraspirazione (ETo)
    const evapotraspirazione = this.calcolaEvapotraspirazione(
      temperatura,
      velocitaVento,
      radiazioneNetta,
      flussoCaloreSuolo,
      pressioneVaporeSaturazione,
      pressioneVaporeEffettiva
    );
  
    // Calcolo dei litri di acqua necessari senza considerare precipitazioni ed efficienza
    let litriNecessari = evapotraspirazione * areaColtivata;
  
    // Sottrai le precipitazioni (convertite in litri)
    litriNecessari -= precipitazioni * areaColtivata;
  
    // Considera l'efficienza del sistema di irrigazione
    litriNecessari /= efficienzaIrrigazione;
  
    // Adatta il fabbisogno alla frequenza di irrigazione
    litriNecessari /= frequenzaIrrigazione;
  
    // Assicura che il fabbisogno non sia negativo
    litriNecessari = Math.max(0, litriNecessari);
  
    return {
      evapotraspirazione: Math.round(evapotraspirazione * 100) / 100, // mm/giorno
      litriNecessari: Math.round(litriNecessari), // Litri
      areaColtivata, // m²
      efficienzaIrrigazione, // Efficienza del sistema
      precipitazioni: Math.round(precipitazioni * 100) / 100, // mm
      frequenzaIrrigazione, // Frequenza (giorni)
    };
  }

  // Questa funzione calcola l'utilizzo dell'acqua in base a temperatura, umidità e radiazione solare.
  // Viene utilizzata per determinare l'uso dell'acqua in relazione a fattori ambientali.
  // La funzione restituisce un valore compreso tra 30 e 100, rappresentando l'utilizzo dell'acqua in percentuale.
  calcolaUtilizzoAcqua(temperatura, umidita, radiazioneSolare) {
    const fattoreTemperatura = Math.max(0, (temperatura - 20) / 30);
    const fattoreUmidità = 1 - (umidita / 100) * 0.7;
    const fattoreRadiazione = radiazioneSolare / 1000;
    
    const utilizzoBase = 60;
    const utilizzo = utilizzoBase * (1 + fattoreTemperatura * 0.8 + fattoreUmidità * 0.5 + fattoreRadiazione * 0.3);
    
    return Math.min(100, Math.max(30, utilizzo));
  }

  // Questa funzione calcola l'efficienza solare in base a diversi fattori.
  // I parametri sono ora, temperatura, copertura nuvolosa e fattore di nuvolosità.
  // La funzione restituisce un valore compreso tra 0 e 100, rappresentando l'efficienza solare in percentuale.
  // La funzione considera il ciclo giorno-notte, l'efficienza della temperatura e il fattore di nuvolosità.
  calcolaEfficienzaSolare(ora, temperatura, coperturaNuvolosa) {
    const fattoreGiornoNotte = this.cicloGiornoNotte(ora);
    const efficienzaTemperatura = Math.max(0.7, 1 - Math.max(0, (temperatura - 25) / 100));
    const fattoreNuvole = 1 - (coperturaNuvolosa / 100) * 0.8;
    const efficienza = this.efficienzaSolareBase * fattoreGiornoNotte * efficienzaTemperatura * fattoreNuvole;
    return Math.max(0, Math.min(100, efficienza));
  }

  // Questa funzione genera i dati ambientali in base al passo temporale corrente.
  // I dati generati includono temperatura, umidità, velocità del vento, pioggia, umidità del suolo,
  // radiazione solare, pH del suolo, bagnatura fogliare e pressione atmosferica.
  // La funzione considera anche la tendenza meteorologica e le condizioni di giorno/notte.
  // I dati vengono restituiti come un oggetto con i valori arrotondati.
  generaDatiAmbientali() {
    const ora = this.passoTempo % 24;
    const cicloGiornoNotte = this.cicloGiornoNotte(ora);
    this.aggiornaTendenzaMeteorologica();
    
    const variazioneTemperatura = 15 * cicloGiornoNotte;
    const temperatura = this.temperaturaBase + variazioneTemperatura;
    
    const umidita = Math.max(30, Math.min(95, 
      this.umiditàBase - (variazioneTemperatura * 2) + (this.ultimaPioggia > 0 ? 20 : 0)
    ));
    
    const coperturaNuvolosa = Math.max(0, Math.min(100, umidita - 40));
    const radiazioneSolare = Math.max(0, 900 * cicloGiornoNotte * (1 - coperturaNuvolosa / 100));

    // Calcola le precipitazioni in base alla tendenza meteorologica
    let precipitazioni = 0;
    if (this.tendenzaMeteorologica === 'in peggioramento' && Math.random() < 0.3) {
      precipitazioni = Math.round(Math.random() * 10 + 5); // Da 5 a 15 mm
    } else if (this.tendenzaMeteorologica === 'stabile' && Math.random() < 0.1) {
      precipitazioni = Math.round(Math.random() * 5); // Da 0 a 5 mm
    }

    // Aggiorna l'ultima pioggia
    this.ultimaPioggia = precipitazioni;

    const timestamp = format(addHours(new Date(0), this.passoTempo), "HH:mm");

    return {
      timestamp,
      temperatura: Math.round(temperatura * 10) / 10,
      umidita: Math.round(umidita),
      velocitaVento: Math.round(this.velocitaVentoBase * (0.8 + cicloGiornoNotte * 0.4) * 10) / 10,
      pioggia: precipitazioni,
      umiditàSuolo: Math.round(this.memoriaUmiditàSuolo[0]),
      radiazioneSolare: Math.round(radiazioneSolare),
      phSuolo: 6.5 + (precipitazioni > 0 ? 0.2 : 0),
      bagnaturaFogliare: Math.round(umidita + (precipitazioni * 20)),
      pressioneAtmosferica: 1013.25 + (precipitazioni > 0 ? -2 : 2),
    };
  }

  // Questa funzione calcola la resa delle colture in base ai dati ambientali correnti o generati.
  generaDatiProduzione() {
    const datiAmbientali = this.datiAmbientaliCorrenti || this.generaDatiAmbientali(); // Usa i dati correnti se presenti o genera nuovi dati
  
    // Validazione dei dati ambientali
    const umiditàSuolo = isNaN(datiAmbientali.umiditàSuolo) ? 70 : datiAmbientali.umiditàSuolo;
    const temperatura = isNaN(datiAmbientali.temperatura) ? 20 : datiAmbientali.temperatura;
    const umidita = isNaN(datiAmbientali.umidita) ? 50 : datiAmbientali.umidita;
    const utilizzoAcqua = this.calcolaUtilizzoAcqua(temperatura, umidita, datiAmbientali.radiazioneSolare);
  
    const ora = parseInt(datiAmbientali.timestamp.split(":")[0], 10);
  
    // Se l'orario è fuori dall'intervallo lavorativo (7:00 - 20:00) non c'è raccolto, quindi ritorno i valori a 0
    if (ora < 7 || ora >= 20) {
      return {
        timestamp: datiAmbientali.timestamp,
        resaGrano: 0,
        resaMais: 0,
        resaSoia: 0,
        efficienzaRisorse: 0,
        utilizzoEnergia: 0,
        nutrientiSuolo: 0,
      };
    }
  
    const fattoreStagionale = this.getFattoreStagionale();
    const cicloGiornoNotte = this.cicloGiornoNotte(ora);
    const fattoreMeteorologico = this.tendenzaMeteorologica === 'in miglioramento' ? 1.1 :
                                 this.tendenzaMeteorologica === 'in peggioramento' ? 0.9 : 1;

    // Funzione per calcolare la variazione percentuale
    // La funzione variazione prende un valore base e una percentuale e restituisce un nuovo valore
    // che varia casualmente attorno al valore base, moltiplicato per la percentuale.
    const variazione = (base, percentuale) => base * (1 + (Math.random() * 2 - 1) * percentuale);
  
    return {
      timestamp: datiAmbientali.timestamp,
      resaGrano: Math.round(variazione(100 * (1 - Math.abs(umiditàSuolo - 70) / 100) * fattoreStagionale * cicloGiornoNotte * fattoreMeteorologico, 0.15)) || 0,
      resaMais: Math.round(variazione(85 * (1 - Math.abs(umiditàSuolo - 65) / 100) * fattoreStagionale * cicloGiornoNotte * fattoreMeteorologico, 0.15)) || 0,
      resaSoia: Math.round(variazione(70 * (1 - Math.abs(umiditàSuolo - 60) / 100) * fattoreStagionale * cicloGiornoNotte * fattoreMeteorologico, 0.15)) || 0,
      efficienzaRisorse: Math.max(0, Math.round(85 * (1 - utilizzoAcqua / 200))) || 0,
      utilizzoEnergia: Math.min(100, Math.round(60 + (temperatura - 20) * 2)),
    };
  }

  // Questa funzione genera i dati di irrigazione in base ai dati ambientali correnti o generati.
  getDatiIrrigazione() {
    const datiAmbientali = this.datiAmbientaliCorrenti || this.generaDatiAmbientali();
    const ora = this.passoTempo % 24;

    const radiazioneSolare = isNaN(datiAmbientali.radiazioneSolare) ? 500 : datiAmbientali.radiazioneSolare;
  
    // Parametri di default per il calcolo dell'evapotraspirazione
    const radiazioneNetta = radiazioneSolare / 100; // Conversione ipotetica in MJ/m²/giorno
    const flussoCaloreSuolo = 0; // Assumiamo che sia trascurabile
    const pressioneVaporeSaturazione = 0.6108 * Math.exp((17.27 * datiAmbientali.temperatura) / (datiAmbientali.temperatura + 237.3)); // kPa
    const pressioneVaporeEffettiva = pressioneVaporeSaturazione * (datiAmbientali.umidita / 100); // kPa
    const areaColtivata = 1000; // m²
    const fabbisognoMassimo = 200; // mm/giorno


    // Calcolo dell'evapotraspirazione (ETo)
    const evapotraspirazione = this.calcolaEvapotraspirazione(
      datiAmbientali.temperatura,
      datiAmbientali.velocitaVento,
      radiazioneNetta,
      flussoCaloreSuolo,
      pressioneVaporeSaturazione,
      pressioneVaporeEffettiva,
    );

    const utilizzoAcquaLitri = evapotraspirazione * areaColtivata; // Litri di acqua necessari

    const utilizzoAcquaPercentuale = Math.min(100, (evapotraspirazione / fabbisognoMassimo) * 100);
  
    const utilizzoAcqua = Math.min(200, Math.max(30, evapotraspirazione * 10)); // Scala il valore di ETo per il consumo d'acqua

    const irrigazione = this.pianificaIrrigazione(
      datiAmbientali.temperatura,
      datiAmbientali.velocitaVento,
      datiAmbientali.radiazioneSolare,
      datiAmbientali.umidita,
      areaColtivata,
      0.9, // Efficienza dell'irrigazione
      datiAmbientali.pioggia,
      1 // Frequenza di irrigazione (ogni giorno)
    );
    
    return {
      timestamp: datiAmbientali.timestamp,
      litriNecessari: Math.round(irrigazione.litriNecessari),
      evapotraspirazione: Math.round(irrigazione.evapotraspirazione),
      areaColtivata: irrigazione.areaColtivata,
      efficienzaIrrigazione: Math.round(irrigazione.efficienzaIrrigazione * 100),
      precipitazioni: Math.round(datiAmbientali.pioggia * 1000),
      utilizzoAcquaLitri: Math.round(utilizzoAcquaLitri),
      utilizzoAcquaPercentuale: Math.round(utilizzoAcquaPercentuale),
      utilizzoAcqua: Math.round(utilizzoAcqua),
      irrigazione: Math.max(0, Math.round(irrigazione.litriNecessari) - Math.round(datiAmbientali.pioggia * 1000)), // Litri
    };
  }

  // Questa funzione genera i dati di sostenibilità in base ai dati ambientali correnti o generati.
  generaDatiSostenibilita() {
    const datiAmbientali = this.datiAmbientaliCorrenti || this.generaDatiAmbientali();
    const ora = this.passoTempo % 24;

    // Calcolo della nuvolosità in base alla pioggia
    // Se c'è pioggia, la nuvolosità è più alta, altrimenti è più bassa
    const nuvolosita = Math.random() * (datiAmbientali.pioggia > 0 ? 0.8 : 0.4); 

    // Calcolo dell'efficienza solare in base ai dati ambientali
    const efficienzaSolare = this.calcolaEfficienzaSolare(
      ora,
      datiAmbientali.temperatura,
      Math.max(0, datiAmbientali.umidita - 40),
      nuvolosita
    );

    // Calcolo dell'adattamento del suolo in base all'umidità
    // Se l'umidità del suolo è molto alta o molto bassa, l'adattamento è più basso
    // Se l'umidità del suolo è intorno al 65%, l'adattamento è massimo
    const adattamentoSuolo = Math.max(0, 1 - Math.abs(datiAmbientali.umiditàSuolo - 65) / 100);
    
    return {
      timestamp: datiAmbientali.timestamp,
      acquaRisparmiata: Math.round(150 * (datiAmbientali.pioggia > 0 ? 1.3 : 1)),
      energiaSolare: Math.round(efficienzaSolare * 0.8),
      efficienzaEnergetica: Math.round(efficienzaSolare),
      riduzioneSprechi: Math.round(82 * adattamentoSuolo),
      indiceBiodiversita: Math.round(65 + adattamentoSuolo * 20),
      emissioniGasSerra: Math.round(45 * (1 - efficienzaSolare / 100)),
    };
  }

  // Questa funzione genera un avviso casuale in base ai dati ambientali correnti o generati.
  // La funzione ha una probabilità del 15% di generare un avviso e seleziona casualmente tra tre tipi di avvisi: 'avviso', 'informazione' e 'successo'.
  // Ogni tipo di avviso ha un insieme di messaggi predefiniti che vengono selezionati casualmente.
  generaAvviso() {
    const datiAmbientali = this.datiAmbientaliCorrenti || this.generaDatiAmbientali();
    if (Math.random() < 0.15) {
      const tipiAvviso = ['avviso', 'informazione', 'successo'];
      const tipoAvviso = tipiAvviso[Math.floor(Math.random() * tipiAvviso.length)];
      const gravità = Math.random() < 0.5 ? 'bassa' : Math.random() < 0.8 ? 'media' : 'alta';
      
      const messaggiAvviso = {
        avviso: [
          { messaggio: 'Livello acqua sotto il 30% nel Campo Nord', fonte: 'Sistema Irrigazione' },
          { messaggio: 'Temperatura elevata rilevata nella Serra 2', fonte: 'Sensori Ambientali' },
          { messaggio: 'Umidità del suolo critica nel Campo Est', fonte: 'Monitoraggio Terreno' },
          { messaggio: 'Efficienza pannelli solari sotto il 70%', fonte: 'Sistema Energetico' }
        ],
        informazione: [
          { messaggio: 'Previsione precipitazioni nelle prossime 24 ore', fonte: 'Meteo' },
          { messaggio: 'Manutenzione programmata del sistema di irrigazione', fonte: 'Manutenzione' },
          { messaggio: 'Aggiornamento parametri di monitoraggio', fonte: 'Sistema' },
          { messaggio: 'Pulizia programmata dei pannelli solari', fonte: 'Manutenzione' }
        ],
        successo: [
          { messaggio: 'Raccolto completato nel Campo Est', fonte: 'Produzione' },
          { messaggio: 'Obiettivo di produzione mensile raggiunto', fonte: 'Performance' },
          { messaggio: 'Ottimizzazione delle risorse completata', fonte: 'Sistema' },
          { messaggio: 'Record di produzione energia solare raggiunto', fonte: 'Energia' }
        ]
      };

      const avvisi = messaggiAvviso[tipoAvviso];
      const avvisoSelezionato = avvisi[Math.floor(Math.random() * avvisi.length)];

      return {
        id: Math.random().toString(36).substr(2, 9),
        tipo: tipoAvviso,
        messaggio: avvisoSelezionato.messaggio,
        timestamp: datiAmbientali.timestamp,
        gravità,
        fonte: avvisoSelezionato.fonte
      };
    }
    return null;
  }
}