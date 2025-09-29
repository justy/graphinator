import { TransformConfig } from './data'

// Available data source templates
export interface DataSourceTemplate {
  id: string
  name: string
  description: string
  type: 'weather' | 'solar' | 'api'
  // For weather sources
  weatherVariables?: {
    value: string
    label: string
    unit: string
  }[]
  // For solar/API sources
  availableFields?: {
    value: string
    label: string
    description: string
  }[]
  defaultConfig?: Partial<ExampleDataSource>
}

export const AVAILABLE_DATA_SOURCES: DataSourceTemplate[] = [
  {
    id: 'weather',
    name: 'Weather (Open-Meteo)',
    description: 'Historical and forecast weather data from Open-Meteo',
    type: 'weather',
    weatherVariables: [
      { value: 'temperature_2m_max', label: 'Max Temperature', unit: '°C' },
      { value: 'temperature_2m_min', label: 'Min Temperature', unit: '°C' },
      { value: 'temperature_2m_mean', label: 'Mean Temperature', unit: '°C' },
      { value: 'precipitation_sum', label: 'Precipitation', unit: 'mm' },
      { value: 'rain_sum', label: 'Rain', unit: 'mm' },
      { value: 'snowfall_sum', label: 'Snowfall', unit: 'cm' },
      { value: 'windspeed_10m_max', label: 'Max Wind Speed', unit: 'km/h' },
      { value: 'windgusts_10m_max', label: 'Max Wind Gusts', unit: 'km/h' },
      { value: 'shortwave_radiation_sum', label: 'Solar Radiation', unit: 'MJ/m²' },
      { value: 'et0_fao_evapotranspiration', label: 'Evapotranspiration', unit: 'mm' },
      { value: 'weathercode', label: 'Weather Code', unit: 'WMO' }
    ],
    defaultConfig: {
      latitude: -34.4278,  // Default to Coledale
      longitude: 150.9451,
      chartType: 'line',
      config: {
        timestampField: 'timestamp',
        valueField: 'value'
      }
    }
  },
  {
    id: 'solar',
    name: 'Solar Generation API',
    description: 'Daily solar generation and consumption data',
    type: 'solar',
    availableFields: [
      { value: 'generated', label: 'Solar Generation', description: 'Daily solar power generated (kWh)' },
      { value: 'consumed', label: 'Power Consumption', description: 'Daily power consumed (kWh)' },
      { value: 'imported', label: 'Grid Import', description: 'Power imported from grid (kWh)' },
      { value: 'exported', label: 'Grid Export', description: 'Power exported to grid (kWh)' }
    ],
    defaultConfig: {
      urlTemplate: 'http://sungrow_api.localhost:3000/daily?date={{date}}',
      chartType: 'area',
      config: {
        timestampField: 'date',
        valueField: 'generated',
        urlDateFormat: 'ddMMyyyy'
      }
    }
  }
]

export interface ExampleDataSource {
  id: string
  name: string
  urlTemplate?: string
  config: TransformConfig
  chartType?: 'line' | 'bar' | 'area'
  color?: string

  // For weather API
  latitude?: number
  longitude?: number
  weatherVariable?: string

  // For static API endpoints
  staticUrl?: string
}

export interface Example {
  id: string
  name: string
  description: string
  dataSources: ExampleDataSource[]
  editable?: boolean
  category?: 'weather' | 'solar' | 'combined' | 'custom'
}

export const PREDEFINED_EXAMPLES: Example[] = [
  {
    id: 'coledale-weather',
    name: 'Coledale Weather',
    description: 'Temperature for Coledale, NSW',
    category: 'weather',
    dataSources: [
      {
        id: 'coledale-temp',
        name: 'Max Temperature (°C)',
        latitude: -34.4278,
        longitude: 150.9451,
        weatherVariable: 'temperature_2m_max',
        config: {
          timestampField: 'timestamp',
          valueField: 'value'
        },
        chartType: 'line',
        color: '#F59E0B'
      }
    ]
  },
  {
    id: 'solar-generation',
    name: 'Solar Generation',
    description: 'Daily solar generation data',
    category: 'solar',
    dataSources: [
      {
        id: 'solar-gen',
        name: 'Solar Generation (kWh)',
        urlTemplate: 'http://sungrow_api.localhost:3000/daily?date={{date}}',
        config: {
          timestampField: 'date',
          valueField: 'generated',
          urlDateFormat: 'ddMMyyyy'
        },
        chartType: 'area',
        color: '#10B981'
      }
    ]
  },
  {
    id: 'solar-vs-temperature',
    name: 'Solar Generation vs Temperature',
    description: 'Compare solar generation with daily temperature',
    category: 'combined',
    dataSources: [
      {
        id: 'combined-solar',
        name: 'Solar Generation (kWh)',
        urlTemplate: 'http://sungrow_api.localhost:3000/daily?date={{date}}',
        config: {
          timestampField: 'date',
          valueField: 'generated',
          urlDateFormat: 'ddMMyyyy'
        },
        chartType: 'area',
        color: '#10B981'
      },
      {
        id: 'combined-temp',
        name: 'Max Temperature (°C)',
        latitude: -34.4278,
        longitude: 150.9451,
        weatherVariable: 'temperature_2m_max',
        config: {
          timestampField: 'timestamp',
          valueField: 'value'
        },
        chartType: 'line',
        color: '#F59E0B'
      }
    ]
  },
  {
    id: 'solar-consumption',
    name: 'Solar vs Consumption',
    description: 'Compare generation with consumption',
    category: 'combined',
    dataSources: [
      {
        id: 'solar-gen-2',
        name: 'Solar Generation (kWh)',
        urlTemplate: 'http://sungrow_api.localhost:3000/daily?date={{date}}',
        config: {
          timestampField: 'date',
          valueField: 'generated',
          urlDateFormat: 'ddMMyyyy'
        },
        chartType: 'area',
        color: '#10B981'
      },
      {
        id: 'solar-cons',
        name: 'Power Consumption (kWh)',
        urlTemplate: 'http://sungrow_api.localhost:3000/daily?date={{date}}',
        config: {
          timestampField: 'date',
          valueField: 'consumed',
          urlDateFormat: 'ddMMyyyy'
        },
        chartType: 'line',
        color: '#EF4444'
      }
    ]
  }
]