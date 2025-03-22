import { addHours, format, getHours, getMonth } from 'date-fns';

// Tipi per i dati simulati
export interface EnvironmentalData {
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

export interface ProductionData {
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

export interface SustainabilityData {
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

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
  source?: string;
}

const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const normalDistribution = (mean: number, stdDev: number): number => {
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
  return mean + stdDev * randStdNormal;
};

export class EnvironmentalSimulator {
  private baseTemperature: number;
  private baseHumidity: number;
  private baseWindSpeed: number;
  private baseSolarEfficiency: number;
  private timeStep: number;
  private seasonalFactor: number;
  private weatherTrend: 'stable' | 'improving' | 'worsening';
  private lastRainfall: number;
  private soilMoistureMemory: number[];
  private weatherPatterns: {
    temperature: number[];
    humidity: number[];
    windSpeed: number[];
  };

  constructor() {
    this.timeStep = 0;
    this.soilMoistureMemory = [];
    this.weatherPatterns = {
      temperature: [],
      humidity: [],
      windSpeed: []
    };
    this.resetSimulation();
  }

  private getSeasonalFactor(): number {
    const month = getMonth(new Date());
    return Math.sin((month + 1) * Math.PI / 6) * 0.5 + 0.5;
  }

  private getDayNightCycle(hour: number): number {
    // Picco alle 14:00 (ora 14) e minimo alle 02:00 (ora 2)
    const peakHour = 14;
    const phase = ((hour - peakHour + 24) % 24) * Math.PI / 12;
    return Math.cos(phase) * 0.5 + 0.5;
  }

  private updateWeatherTrend(): void {
    if (Math.random() < 0.1) {
      const trends: Array<'stable' | 'improving' | 'worsening'> = ['stable', 'improving', 'worsening'];
      this.weatherTrend = trends[Math.floor(Math.random() * trends.length)];
    }
  }

  resetSimulation(): void {
    this.timeStep = 0;
    this.seasonalFactor = this.getSeasonalFactor();
    this.baseTemperature = 20 + this.seasonalFactor * 10;
    this.baseHumidity = 60 - this.seasonalFactor * 20;
    this.baseWindSpeed = 8 + this.seasonalFactor * 4;
    this.baseSolarEfficiency = 85;
    this.weatherTrend = 'stable';
    this.lastRainfall = 0;
    this.soilMoistureMemory = Array(24).fill(70);
  }

  private calculateWaterUsage(temperature: number, humidity: number, solarRadiation: number): number {
    // Base water usage increases with temperature
    const tempFactor = Math.max(0, (temperature - 20) / 30);
    // Humidity reduces water needs
    const humidityFactor = 1 - (humidity / 100) * 0.7;
    // Solar radiation increases evaporation
    const radiationFactor = solarRadiation / 1000;
    
    // Combine factors with weights
    const baseUsage = 60;
    const usage = baseUsage * (1 + tempFactor * 0.8 + humidityFactor * 0.5 + radiationFactor * 0.3);
    
    return Math.min(100, Math.max(30, usage));
  }

  private calculateSolarEfficiency(hour: number, temperature: number, cloudCover: number): number {
    const dayNightFactor = this.getDayNightCycle(hour);
    
    // Temperature affects panel efficiency (higher temps reduce efficiency)
    const tempEfficiency = Math.max(0.7, 1 - Math.max(0, (temperature - 25) / 100));
    
    // Cloud cover reduces efficiency
    const cloudFactor = 1 - (cloudCover / 100) * 0.8;
    
    // Calculate final efficiency
    const efficiency = this.baseSolarEfficiency * dayNightFactor * tempEfficiency * cloudFactor;
    
    return Math.max(0, Math.min(100, efficiency));
  }

  generateEnvironmentalData(): EnvironmentalData {
    const hour = this.timeStep % 24;
    const dayNightFactor = this.getDayNightCycle(hour);
    this.updateWeatherTrend();
    
    // Temperatura con ciclo giorno/notte realistico
    const tempVariation = 15 * dayNightFactor; // Variazione massima di 15°C
    const temperature = this.baseTemperature + tempVariation;
    
    // Umidità inversamente correlata alla temperatura
    const humidity = Math.max(30, Math.min(95, 
      this.baseHumidity - (tempVariation * 2) + (this.lastRainfall > 0 ? 20 : 0)
    ));
    
    // Radiazione solare basata sul ciclo giorno/notte
    const cloudCover = Math.max(0, Math.min(100, humidity - 40));
    const solarRadiation = Math.max(0, 1000 * dayNightFactor * (1 - cloudCover / 100));

    const timestamp = format(addHours(new Date(), this.timeStep), "HH:mm");
    this.timeStep++;

    return {
      timestamp,
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      windSpeed: Math.round(this.baseWindSpeed * (0.8 + dayNightFactor * 0.4) * 10) / 10,
      rainfall: this.lastRainfall,
      soilMoisture: Math.round(this.soilMoistureMemory[0]),
      solarRadiation: Math.round(solarRadiation),
      soilPH: 6.5 + (this.lastRainfall > 0 ? 0.2 : 0),
      leafWetness: Math.round(humidity + (this.lastRainfall * 20)),
      atmosphericPressure: 1013.25 + (this.lastRainfall > 0 ? -2 : 2)
    };
  }

  generateProductionData(): ProductionData {
    const envData = this.generateEnvironmentalData();
    const waterUsage = this.calculateWaterUsage(
      envData.temperature,
      envData.humidity,
      envData.solarRadiation
    );
    
    return {
      timestamp: envData.timestamp,
      wheatYield: Math.round(100 * (1 - Math.abs(envData.soilMoisture - 70) / 100)),
      cornYield: Math.round(85 * (1 - Math.abs(envData.soilMoisture - 65) / 100)),
      soyYield: Math.round(70 * (1 - Math.abs(envData.soilMoisture - 60) / 100)),
      resourceEfficiency: Math.round(85 * (1 - waterUsage / 200)),
      waterUsage: Math.round(waterUsage),
      energyUsage: Math.round(60 + (envData.temperature - 20) * 2),
      soilNutrients: Math.round(80 - (waterUsage - 50) / 2),
      pestControl: Math.round(90 - (envData.humidity - 60) / 2),
      cropHealth: Math.round(85 * (1 - Math.abs(envData.soilMoisture - 65) / 100))
    };
  }

  generateSustainabilityData(): SustainabilityData {
    const envData = this.generateEnvironmentalData();
    const hour = this.timeStep % 24;
    
    const solarEfficiency = this.calculateSolarEfficiency(
      hour,
      envData.temperature,
      Math.max(0, envData.humidity - 40)
    );
    
    return {
      timestamp: envData.timestamp,
      carbonFootprint: Math.round(40 * (1 - solarEfficiency / 100)),
      waterSaved: Math.round(150 * (envData.rainfall > 0 ? 1.2 : 1)),
      solarEnergy: Math.round(solarEfficiency * 0.75),
      energyEfficiency: Math.round(solarEfficiency),
      wasteReduction: Math.round(82 * (1 - Math.abs(envData.soilMoisture - 65) / 100)),
      biodiversityIndex: 75,
      organicMatterContent: Math.round(65 + (envData.soilMoisture - 50) / 3),
      greenhouseGasEmissions: Math.round(45 * (1 - solarEfficiency / 100)),
      renewableEnergyRatio: Math.round(solarEfficiency)
    };
  }

  generateAlert(): Alert | null {
    if (Math.random() < 0.15) {
      const alertTypes: Array<Alert['type']> = ['warning', 'info', 'success'];
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severity = Math.random() < 0.5 ? 'low' : Math.random() < 0.8 ? 'medium' : 'high';
      
      const alertMessages = {
        warning: [
          { message: 'Livello acqua sotto il 30% in Campo Nord', source: 'Sistema Irrigazione' },
          { message: 'Temperatura elevata rilevata in Serra 2', source: 'Sensori Ambientali' },
          { message: 'Umidità del suolo critica in Campo Est', source: 'Monitoraggio Terreno' },
          { message: 'Efficienza pannelli solari sotto il 70%', source: 'Sistema Energetico' }
        ],
        info: [
          { message: 'Previsione precipitazioni nelle prossime 24h', source: 'Meteo' },
          { message: 'Manutenzione programmata sistema irrigazione', source: 'Manutenzione' },
          { message: 'Aggiornamento parametri di monitoraggio', source: 'Sistema' },
          { message: 'Pulizia programmata pannelli solari', source: 'Manutenzione' }
        ],
        success: [
          { message: 'Raccolto completato in Campo Est', source: 'Produzione' },
          { message: 'Obiettivo produzione mensile raggiunto', source: 'Performance' },
          { message: 'Ottimizzazione risorse completata', source: 'Sistema' },
          { message: 'Record produzione energia solare raggiunto', source: 'Energia' }
        ]
      };

      const alerts = alertMessages[alertType];
      const selectedAlert = alerts[Math.floor(Math.random() * alerts.length)];

      return {
        id: Math.random().toString(36).substr(2, 9),
        type: alertType,
        message: selectedAlert.message,
        timestamp: format(new Date(), "HH:mm"),
        severity,
        source: selectedAlert.source
      };
    }
    return null;
  }
}