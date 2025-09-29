import { TransformConfig } from './data'

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