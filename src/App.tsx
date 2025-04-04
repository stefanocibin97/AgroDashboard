import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {BarChart3, Cloud, Droplets, Leaf, Settings, Sun, Wind, AlertTriangle, Zap, Sprout, Recycle, Clock, LocateFixed, Bell, X, Power} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line} from 'recharts';
import { format, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { SchedaDati } from './utility/componenti';

interface DatiAmbientali {
  timestamp: string;
  temperatura: number;
  umidita: number;
  velocitaVento: number;
  pioggia: number;
  umiditaSuolo: number;
  radiazioneSolare: number;
  phSuolo: number;
  bagnaturaFogliare: number;
  pressioneAtmosferica: number;
}

interface DatiProduzione {
  timestamp: string;
  resaGrano: number;
  resaMais: number;
  resaSoia: number;
  efficienzaRisorse: number;
  utilizzoEnergia: number;
}

interface DatiSostenibilita {
  timestamp: string;
  acquaRisparmiata: number;
  energiaSolare: number;
  efficienzaEnergetica: number;
  riduzioneSprechi: number;
  indiceBiodiversita: number;
  emissioniGasSerra: number;
}

interface Avviso {
  id: string;
  tipo: 'avviso' | 'informazione' | 'successo';
  messaggio: string;
  timestamp: string;
  gravita?: 'bassa' | 'media' | 'alta';
  fonte?: string;
  letto?: boolean;
}

interface DatiIrrigazione {
  timestamp: string;
  litriNecessari: number;
  evapotraspirazione: number;
  areaColtivata: number;
  efficienzaIrrigazione: number;
  precipitazioni: number;
  utilizzoAcquaLitri: number;
  utilizzoAcquaPercentuale: number;
  utilizzoAcqua: number;
  irrigazione: number;
}

const API_KEY = import.meta.env.VITE_API_KEY || '';

function App() {
  const [datiAmbientali, impostaDatiAmbientali] = useState<DatiAmbientali[]>([]);
  const [datiProduzione, impostaDatiProduzione] = useState<DatiProduzione[]>([]);
  const [datiSostenibilita, impostaDatiSostenibilita] = useState<DatiSostenibilita[]>([]);
  const [DatiIrrigazione, impostaDatiIrrigazione] = useState<DatiIrrigazione[]>([]);
  const [avvisi, impostaAvvisi] = useState<Avviso[]>([]);
  const [conteggioNonLetti, impostaConteggioNonLetti] = useState(0);
  const [mostraNotifiche, impostaMostraNotifiche] = useState(false);
  const [ambientaleCorrente, impostaAmbientaleCorrente] = useState<DatiAmbientali | null>(null);
  const [produzioneCorrente, impostaProduzioneCorrente] = useState<DatiProduzione | null>(null);
  const [irrigazioneCorrente, impostaIrrigazioneCorrente] = useState<DatiIrrigazione | null>(null);
  const [sostenibilitaCorrente, impostaSostenibilitaCorrente] = useState<DatiSostenibilita | null>(null);
  const [meteo, impostaMeteo] = useState<any>(null);
  const [caricamento, impostaCaricamento] = useState(true);
  const [errore, impostaErrore] = useState<string | null>(null);
  const [tempoCorrente, impostaTempoCorrente] = useState(new Date());
  const [simulazioneAttiva, impostaSimulazioneAttiva] = useState(false);
  const [posizioneAbilitata, impostaPosizioneAbilitata] = useState(false);
  const [giorniPrevisione, impostaGiorniPrevisione] = useState<Date[]>([]);

  useEffect(() => {
    const giorni = Array.from({ length: 5 }, (_, i) => addDays(new Date(), i + 1));
    impostaGiorniPrevisione(giorni);
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('avviso', (avviso: Avviso) => {
      const nuovoAvviso = { ...avviso, letto: false };
      impostaAvvisi(prev => {
        const aggiornato = [nuovoAvviso, ...prev];
        return aggiornato.slice(0, 10);
      });
      impostaConteggioNonLetti(prev => prev + 1);
    });

    socket.on('dati-ambientali', (dati: DatiAmbientali) => {
      impostaAmbientaleCorrente(prev => {
        if (!prev) return dati;
        return simulazioneAttiva ? dati : prev;
      });
      impostaDatiAmbientali(prev => {
        const aggiornato = [...prev, dati];
        return aggiornato.slice(-24);
      });
      impostaTempoCorrente(prev => {
        const prossimo = new Date(prev);
        prossimo.setHours(prossimo.getHours() + 1);
        return prossimo;
      });
    });

    socket.on('dati-produzione', (dati: DatiProduzione) => {
      impostaProduzioneCorrente(dati);
      impostaDatiProduzione(prev => {
        const aggiornato = [...prev, dati];
        return aggiornato.slice(-24);
      });
    });

    socket.on('dati-sostenibilita', (dati: DatiSostenibilita) => {
      impostaSostenibilitaCorrente(dati);
      impostaDatiSostenibilita(prev => {
        const aggiornato = [...prev, dati];
        return aggiornato.slice(-24);
      });
    });

    socket.on('dati-irrigazione', (dati: DatiIrrigazione) => {
      impostaIrrigazioneCorrente(dati);
      impostaDatiIrrigazione(prev => {
        const aggiornato = [...prev, dati];
        return aggiornato.slice(-24);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [simulazioneAttiva]);

  const gestisciClickNotifiche = () => {
    impostaMostraNotifiche(!mostraNotifiche);
    if (!mostraNotifiche) {
      impostaConteggioNonLetti(0);
      impostaAvvisi(prev => prev.map(avviso => ({ ...avviso, letto: true })));
    }
  };

  const recuperaMeteo = async (latitudine: number, longitudine: number) => {
    try {
      const rispostaMeteoAttuale = await fetch(
        `https://pro.openweathermap.org/data/2.5/weather?lat=${latitudine}&lon=${longitudine}&appid=${API_KEY}&units=metric&lang=it`
      );
      if (!rispostaMeteoAttuale.ok) throw new Error("Errore nel recupero dei dati attuali");

      const datiMeteoAttuale = await rispostaMeteoAttuale.json();

      const rispostaPrevisioni = await fetch(
        `https://pro.openweathermap.org/data/2.5/forecast/climate?lat=${latitudine}&lon=${longitudine}&appid=${API_KEY}&units=metric&lang=it`
      );
      if (!rispostaPrevisioni.ok) throw new Error("Errore nel recupero delle previsioni");

      const datiPrevisioni = await rispostaPrevisioni.json();

      impostaMeteo({
        attuale: datiMeteoAttuale,
        previsioni: datiPrevisioni.list,
      });
    } catch (err: any) {
      impostaErrore(err.message);
    } finally {
      impostaCaricamento(false);
    }
  };

  const ottieniPosizione = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (posizione) => {
          const { latitude, longitude } = posizione.coords;
          impostaPosizioneAbilitata(true);
          recuperaMeteo(latitude, longitude);
        },
        () => {
          impostaPosizioneAbilitata(false);
          impostaSimulazioneAttiva(true);
          impostaCaricamento(false);
          alert("Impossibile ottenere la posizione. Attivazione della simulazione.");
        }
      );
    } else {
      impostaPosizioneAbilitata(false);
      impostaSimulazioneAttiva(true);
      alert("Geolocalizzazione non supportata dal browser. Attivata la simulazione dei dati.");
    }
  };

  const gestisciSimulazione = () => {
    if (!posizioneAbilitata && !simulazioneAttiva) {
      alert("È necessario dare il consenso della posizione per vedere i dati ambientali reali.");
      return;
    }
    impostaSimulazioneAttiva(!simulazioneAttiva);
  };

  const generaDatiSimulati = () => {
    const condizioniMeteo = [
      { descrizione: "Soleggiato", icona: "01d" },
      { descrizione: "Parzialmente nuvoloso", icona: "02d" },
      { descrizione: "Nuvoloso", icona: "03d" },
      { descrizione: "Pioggia leggera", icona: "09d" },
      { descrizione: "Temporale", icona: "11d" },
    ];

    return Array.from({ length: 5 }, (_, i) => {
      const condizione = condizioniMeteo[Math.floor(Math.random() * condizioniMeteo.length)];
      return {
        temperatura: Math.random() * (30 - 15) + 15,
        descrizione: condizione.descrizione,
        icona: condizione.icona,
      };
    });
  };

  useEffect(() => {
    if (!simulazioneAttiva) {
      ottieniPosizione();
    }
  }, [simulazioneAttiva]);

  const COLORI = ['#059669', '#0EA5E9', '#EAB308', '#EC4899'];

  if (caricamento) return <div>Caricamento...</div>;
  if (errore) return <div>Errore: {errore}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6 sticky top-0 z-50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <Leaf className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AgroDashboard</h1>
                <p className="text-green-100 text-sm">Monitoraggio in Tempo Reale</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Clock className="h-5 w-5" />
                <span className="font-medium">
                  {simulazioneAttiva
                    ? `${format(tempoCorrente, "dd/MM/yyyy")} ${ambientaleCorrente?.timestamp || ""}`
                    : `${format(tempoCorrente, "dd/MM/yyyy")} ${format(tempoCorrente, "HH:mm")}`}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <LocateFixed className="h-5 w-5" />
                <span className="font-medium">
                  {meteo?.attuale?.name || "Posizione non disponibile"}
                </span>
              </div>

              <div className="relative">
                <button
                  onClick={gestisciClickNotifiche}
                  className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors relative"
                >
                  <Bell className="h-6 w-6" />
                  {conteggioNonLetti > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conteggioNonLetti}
                    </span>
                  )}
                </button>

                {mostraNotifiche && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl text-gray-800 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Notifiche</h3>
                        <button
                          onClick={() => impostaMostraNotifiche(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {avvisi.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Nessuna notifica
                        </div>
                      ) : (
                        avvisi.map(avviso => (
                          <div
                            key={avviso.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!avviso.letto ? 'bg-blue-50' : ''
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${avviso.tipo === 'avviso' ? 'bg-yellow-100 text-yellow-600' :
                                avviso.tipo === 'informazione' ? 'bg-blue-100 text-blue-600' :
                                  'bg-green-100 text-green-600'
                                }`}>
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{avviso.messaggio}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">{avviso.timestamp}</span>
                                  {avviso.fonte && (
                                    <>
                                      <span className="text-xs text-gray-300">•</span>
                                      <span className="text-xs text-gray-500">{avviso.fonte}</span>
                                    </>
                                  )}
                                  {avviso.gravita && (
                                    <>
                                      <span className="text-xs text-gray-300">•</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${avviso.gravita === 'alta' ? 'bg-red-100 text-red-800' :
                                        avviso.gravita === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-green-100 text-green-800'
                                        }`}>
                                        {avviso.gravita}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Modalità Simulazione</h2>
              <p className="text-sm text-gray-500">
                {simulazioneAttiva ? 'Dati simulati attivi' : 'Dati reali in uso'}
              </p>
            </div>
            <button
              onClick={gestisciSimulazione}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${simulazioneAttiva
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Power className={`h-5 w-5 ${simulazioneAttiva ? 'text-white' : 'text-gray-600'}`} />
              <span>{simulazioneAttiva ? 'Disattiva Simulazione' : 'Attiva Simulazione'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <SchedaDati
                icon={<Sun className="h-5 w-5" />} label="Temperatura" unit="°C" bgColor="bg-yellow-100" iconColor="text-yellow-600"
                value={simulazioneAttiva ? ambientaleCorrente?.temperatura : meteo?.attuale?.main?.temp}
              />
              <SchedaDati
                icon={<Droplets className="h-5 w-5" />} label="Umidità" unit="%" bgColor="bg-blue-100" iconColor="text-blue-600"
                value={simulazioneAttiva ? ambientaleCorrente?.umidita : meteo?.attuale?.main?.humidity}
              />
              <SchedaDati
                icon={<Wind className="h-5 w-5" />} label="Vento" unit=" km/h" bgColor="bg-gray-100" iconColor="text-gray-600"
                value={simulazioneAttiva ? ambientaleCorrente?.velocitaVento : meteo?.attuale?.wind?.speed}
              />
              <SchedaDati
                icon={<Zap className="h-5 w-5" />} label="Radiazione" unit=" W/m²" bgColor="bg-yellow-100" iconColor="text-yellow-600"
                value={ambientaleCorrente?.radiazioneSolare}
              />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Previsioni Meteo</h2>
                  <p className="text-sm text-gray-500">Prossimi giorni</p>
                </div>
                <Cloud className="h-6 w-6 text-blue-500" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(simulazioneAttiva ? generaDatiSimulati() : meteo?.previsioni)?.slice(0, 4).map((day: any, index: number) => {
                  if (!day || (!simulazioneAttiva && !day.weather?.[0])) {
                    return (
                      <div key={index} className="text-center text-gray-500">
                        Dati non disponibili
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-600">
                        {format(giorniPrevisione[index], "EEEE", { locale: it })}
                      </p>
                      <div className="flex justify-center items-center my-2">
                        <img
                          src={`https://openweathermap.org/img/wn/${simulazioneAttiva ? day.icona : day.weather[0].icon}@2x.png`}
                          alt={simulazioneAttiva ? day.descrizione : day.weather[0].description}
                          className="h-12 w-12"
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        {simulazioneAttiva ? day.descrizione : day.weather[0].description}
                      </p>
                      <p className="text-lg font-bold">
                        {simulazioneAttiva ? `${Math.round(day.temperatura)}°C` : `${Math.round(day.temp.max)}°C / ${Math.round(day.temp.min)}°C`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Produzione Colture</h2>
                  <p className="text-sm text-gray-500">Andamento giornaliero</p>
                </div>
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datiProduzione.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `${value} (t/ha)`} />
                    <Bar dataKey="resaGrano" name="Grano" fill="#059669" />
                    <Bar dataKey="resaMais" name="Mais" fill="#0EA5E9" />
                    <Bar dataKey="resaSoia" name="Soia" fill="#EAB308" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Andamento Utilizzo Acqua</h2>
                  <p className="text-sm text-gray-500">Confronto tra fabbisogno irriguo e precipitazioni</p>
                </div>
                <Droplets className="h-6 w-6 text-blue-500" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={DatiIrrigazione.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `${value}`} />
                    <Legend />
                    <Line type="monotone" dataKey="utilizzoAcquaLitri" name="Utilizzo Acqua (litri)" stroke="#059669" />
                    <Line type="monotone" dataKey="precipitazioni" name="Precipitazioni (mm)" stroke="#0EA5E9" />
                    <Line type="monotone" dataKey="litriNecessari" name="Litri Necessari" stroke="#EAB308" />
                    <Line type="monotone" dataKey="irrigazione" name="Irrigazione (litri)" stroke="#EC4899" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Energia Solare</h2>
                  <p className="text-sm text-gray-500">Produzione e Efficienza</p>
                </div>
                <Zap className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datiSostenibilita.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="energiaSolare" name="Energia Prodotta (kWh)" stroke="#EAB308" fill="#FEF3C7" />
                    <Area type="monotone" dataKey="efficienzaEnergetica" name="Efficienza (%)" stroke="#059669" fill="#ECFDF5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Bilancio Sostenibilità</h2>
                <Recycle className="h-6 w-6 text-green-600" />
              </div>
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Energia Solare (kWh)', value: sostenibilitaCorrente?.energiaSolare || 0 },
                        { name: 'Acqua Risparmiata (litri)', value: sostenibilitaCorrente?.acquaRisparmiata || 0 },
                        { name: 'Riduzione Rifiuti (%)', value: sostenibilitaCorrente?.riduzioneSprechi || 0 },
                        { name: 'Biodiversità (indice)', value: sostenibilitaCorrente?.indiceBiodiversita || 0 }
                      ]}
                      cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value"
                    >
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORI[index % COLORI.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Efficienza Produttiva</span>
                    <span className="text-green-600 font-semibold">
                      {produzioneCorrente?.efficienzaRisorse}%
                    </span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${produzioneCorrente?.efficienzaRisorse}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Utilizzo Acqua</span>
                    <span className="text-blue-600 font-semibold">
                      {irrigazioneCorrente?.utilizzoAcquaPercentuale}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${irrigazioneCorrente?.utilizzoAcquaPercentuale}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Consumo Energia</span>
                    <span className="text-yellow-600 font-semibold">
                      {produzioneCorrente?.utilizzoEnergia}%
                    </span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${produzioneCorrente?.utilizzoEnergia}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Indici di Sostenibilità</h2>
                  <p className="text-sm text-gray-500">Performance ambientale</p>
                </div>
                <Sprout className="h-6 w-6 text-green-500" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[sostenibilitaCorrente!].filter(Boolean)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Sostenibilità" dataKey="value" stroke="#059669" fill="#059669" fillOpacity={0.6}
                      data={[
                        {
                          name: 'Efficienza Energetica', value: sostenibilitaCorrente?.efficienzaEnergetica
                        },
                        {
                          name: 'Riduzione Rifiuti', value: sostenibilitaCorrente?.riduzioneSprechi
                        },
                        {
                          name: 'Biodiversità', value: sostenibilitaCorrente?.indiceBiodiversita
                        },
                        {
                          name: 'Risparmio Acqua', value: (sostenibilitaCorrente?.acquaRisparmiata ?? 0) / 2
                        },
                        {
                          name: 'Impronta Carbonica', value: 100 - (sostenibilitaCorrente?.emissioniGasSerra || 0)
                        }
                      ].filter(item => item.value !== undefined)}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;