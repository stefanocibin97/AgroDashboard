import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  BarChart3,
  Cloud,
  Droplets,
  Leaf,
  Settings,
  Sun,
  Wind,
  TrendingUp,
  LineChart,
  ChevronRight,
  AlertTriangle,
  Zap,
  Sprout,
  Recycle,
  Clock,
  LocateFixed,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudDrizzle,
  CloudOff,
  CloudFog,
  CloudSun,
  CloudMoon,
  Thermometer,
  Droplet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { DataCard } from './utils/oggettigenerici';

// Tipi di dati
interface EnvironmentalData {
  timestamp: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  soilMoisture: number;
  solarRadiation: number;
  soilPH: number;
  leafWetness: number;
  atmosphericPressure: number;
}

interface ProductionData {
  timestamp: string;
  wheatYield: number;
  cornYield: number;
  soyYield: number;
  resourceEfficiency: number;
  waterUsage: number;
  energyUsage: number;
  soilNutrients: number;
  pestControl: number;
  cropHealth: number;
}

interface SustainabilityData {
  timestamp: string;
  carbonFootprint: number;
  waterSaved: number;
  solarEnergy: number;
  energyEfficiency: number;
  wasteReduction: number;
  biodiversityIndex: number;
  organicMatterContent: number;
  greenhouseGasEmissions: number;
  renewableEnergyRatio: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
  source?: string;
}

const API_KEY = import.meta.env.VITE_API_KEY || '';

function App() {
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData[]>([]);
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [sustainabilityData, setSustainabilityData] = useState<SustainabilityData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentEnvironmental, setCurrentEnvironmental] = useState<EnvironmentalData | null>(null);
  const [currentProduction, setCurrentProduction] = useState<ProductionData | null>(null);
  const [currentSustainability, setCurrentSustainability] = useState<SustainabilityData | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('environmental-data', (data: EnvironmentalData) => {
      setCurrentEnvironmental(data);
      setEnvironmentalData(prev => {
        const updated = [...prev, data];
        return updated.slice(-24);
      });
      setCurrentTime(prev => {
        const next = new Date(prev);
        next.setHours(next.getHours() + 1);
        return next;
      });
    });

    socket.on('production-data', (data: ProductionData) => {
      setCurrentProduction(data);
      setProductionData(prev => {
        const updated = [...prev, data];
        return updated.slice(-24);
      });
    });

    socket.on('sustainability-data', (data: SustainabilityData) => {
      setCurrentSustainability(data);
      setSustainabilityData(prev => {
        const updated = [...prev, data];
        return updated.slice(-24);
      });
    });

    socket.on('alert', (alert: Alert) => {
      setAlerts(prev => {
        const updated = [alert, ...prev];
        return updated.slice(0, 5);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchWeather = async (latitude: number, longitude: number) => {
    try {
      // Chiamata per il meteo attuale
      const currentWeatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=it`
      );
      if (!currentWeatherResponse.ok) throw new Error("Errore nel recupero dei dati attuali");

      const currentWeatherData = await currentWeatherResponse.json();

      // Chiamata per le previsioni dei prossimi giorni
      const forecastResponse = await fetch(
        `https://pro.openweathermap.org/data/2.5/forecast/climate?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=it`
      );
      if (!forecastResponse.ok) throw new Error("Errore nel recupero delle previsioni");

      const forecastData = await forecastResponse.json();

      // Imposta i dati nel tuo stato
      setWeather({
        current: currentWeatherData,
        daily: forecastData.list, // Assumendo che forecastData.daily contenga i dati giornalieri
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(latitude, longitude);
        },
        () => {
          setError("Impossibile ottenere la posizione");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocalizzazione non supportata dal browser");
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const COLORS = ['#059669', '#0EA5E9', '#EAB308', '#EC4899'];

  if (loading) return <div>Caricamento...</div>;
  if (error) return <div>Errore: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6">
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Clock className="h-5 w-5" />
                <span className="font-medium">
                  {format(currentTime, "dd/MM/yyyy HH:mm")}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <LocateFixed className="h-5 w-5" />
                <span className="font-medium">
                  {weather?.current?.name || "Posizione non disponibile"}
                </span>
              </div>
              <button className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <DataCard
                icon={<Sun className="h-5 w-5" />}
                label="Temperatura"
                value={weather?.current?.main?.temp}
                unit="°C"
                bgColor="bg-yellow-100"
                iconColor="text-yellow-600"
              />
              <DataCard
                icon={<Droplets className="h-5 w-5" />}
                label="Umidità"
                value={weather?.current?.main?.humidity}
                unit="%"
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <DataCard
                icon={<Wind className="h-5 w-5" />}
                label="Vento"
                value={weather?.current?.wind?.speed}
                unit=" km/h"
                bgColor="bg-gray-100"
                iconColor="text-gray-600"
              />
              <DataCard
                icon={<Zap className="h-5 w-5" />}
                label="Radiazione"
                value={currentEnvironmental?.solarRadiation}
                unit=" W/m²"
                bgColor="bg-yellow-100"
                iconColor="text-yellow-600"
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
                {weather?.daily?.slice(1, 5).map((day: any, index: number) => {
                  if (!day || !day.weather || !day.weather[0]) {
                    return (
                      <div key={index} className="text-center text-gray-500">
                        Dati non disponibili
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-600">
                        {format(new Date(day.dt * 1000), "EEEE", { locale: it })}
                      </p>
                      <div className="flex justify-center items-center my-2">
                        <img
                          src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                          alt={day.weather[0].description}
                          className="h-12 w-12"
                        />
                      </div>
                      <p className="text-sm text-gray-500">{day.weather[0].description}</p>
                      <p className="text-lg font-bold">
                        {Math.round(day.temp.max)}°C / {Math.round(day.temp.min)}°C
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">Energia Solare</h2>
                    <p className="text-sm text-gray-500">Produzione e Efficienza</p>
                  </div>
                  <Zap className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sustainabilityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="solarEnergy"
                        name="Energia Prodotta (kWh)"
                        stroke="#EAB308"
                        fill="#FEF3C7"
                      />
                      <Area
                        type="monotone"
                        dataKey="energyEfficiency"
                        name="Efficienza (%)"
                        stroke="#059669"
                        fill="#ECFDF5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
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
                    <RadarChart data={[currentSustainability!].filter(Boolean)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Sostenibilità"
                        dataKey="value"
                        stroke="#059669"
                        fill="#059669"
                        fillOpacity={0.6}
                        data={[
                          {
                            name: 'Efficienza Energetica',
                            value: currentSustainability?.energyEfficiency
                          },
                          {
                            name: 'Riduzione Rifiuti',
                            value: currentSustainability?.wasteReduction
                          },
                          {
                            name: 'Biodiversità',
                            value: currentSustainability?.biodiversityIndex
                          },
                          {
                            name: 'Risparmio Acqua',
                            value: currentSustainability?.waterSaved / 2
                          },
                          {
                            name: 'Impronta Carbonica',
                            value: 100 - (currentSustainability?.carbonFootprint || 0)
                          }
                        ].filter(item => item.value !== undefined)}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Produzione Colture</h2>
                  <p className="text-sm text-gray-500">Andamento giornaliero</p>
                </div>
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="wheatYield" name="Grano" fill="#059669" />
                    <Bar dataKey="cornYield" name="Mais" fill="#0EA5E9" />
                    <Bar dataKey="soyYield" name="Soia" fill="#EAB308" />
                  </BarChart>
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
                        { name: 'Energia Solare', value: currentSustainability?.solarEnergy || 0 },
                        { name: 'Acqua Risparmiata', value: currentSustainability?.waterSaved || 0 },
                        { name: 'Riduzione Rifiuti', value: currentSustainability?.wasteReduction || 0 },
                        { name: 'Biodiversità', value: currentSustainability?.biodiversityIndex || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                      {currentProduction?.resourceEfficiency}%
                    </span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${currentProduction?.resourceEfficiency}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Utilizzo Acqua</span>
                    <span className="text-blue-600 font-semibold">
                      {currentProduction?.waterUsage}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${currentProduction?.waterUsage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Consumo Energia</span>
                    <span className="text-yellow-600 font-semibold">
                      {currentProduction?.energyUsage}%
                    </span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${currentProduction?.energyUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Notifiche</h2>
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="space-y-4">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`p-1 rounded-full ${alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        alert.type === 'info' ? 'bg-blue-100 text-blue-600' :
                          'bg-green-100 text-green-600'
                      }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <span className="text-xs text-gray-400">{alert.timestamp}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;