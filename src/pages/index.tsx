import React, { useState, useEffect } from 'react'
import DataGraph from '@/components/DataGraph'
import DataSourceManager from '@/components/DataSourceManager'
import { DataLoader } from '@/lib/dataLoader'
import { DataSource, DataSeries, GraphConfig, DataPoint } from '@/types/data'
import { format, subDays } from 'date-fns'

export default function Home() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [dataSeries, setDataSeries] = useState<DataSeries[]>([])
  const [loading, setLoading] = useState(false)
  const [graphTitle, setGraphTitle] = useState('Data Visualization')
  const [showExamples, setShowExamples] = useState(false)

  const handleAddSource = async (source: DataSource) => {
    setDataSources([...dataSources, source])
    setLoading(true)

    try {
      let data: DataPoint[] = []

      if (source.type === 'csv' && source.file && source.transformConfig) {
        data = await DataLoader.loadFromCSV(source.file, source.transformConfig)
      } else if (source.type === 'json' && source.file && source.transformConfig) {
        data = await DataLoader.loadFromJSON(source.file, source.transformConfig)
      } else if (source.type === 'api' && source.url && source.transformConfig) {
        data = await DataLoader.loadFromAPI(source.url, source.transformConfig)
      }

      const newSeries: DataSeries = {
        id: source.id,
        name: source.name,
        data,
        type: 'line'
      }

      setDataSeries([...dataSeries, newSeries])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data source. Please check your configuration.')
    } finally {
      setLoading(false)
    }
  }

  const loadExampleData = async () => {
    setLoading(true)
    setShowExamples(true)

    try {
      const endDate = new Date()
      const startDate = subDays(endDate, 7)

      const weatherData = await DataLoader.loadWeatherData(
        37.7749,
        -122.4194,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        'temperature_2m_max'
      )

      const weatherSeries: DataSeries = {
        id: 'weather-temp',
        name: 'Max Temperature (°C)',
        data: weatherData,
        type: 'line',
        color: '#F59E0B',
        unit: '°C'
      }

      const precipData = await DataLoader.loadWeatherData(
        37.7749,
        -122.4194,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        'precipitation_sum'
      )

      const precipSeries: DataSeries = {
        id: 'weather-precip',
        name: 'Precipitation (mm)',
        data: precipData,
        type: 'bar',
        color: '#3B82F6',
        unit: 'mm'
      }

      setDataSeries([weatherSeries, precipSeries])
      setGraphTitle('San Francisco Weather - Last 7 Days')
    } catch (error) {
      console.error('Error loading example data:', error)
      alert('Failed to load example data')
    } finally {
      setLoading(false)
    }
  }

  const loadSolarExample = async () => {
    setLoading(true)
    setShowExamples(true)

    try {
      const today = new Date()
      const dates = Array.from({ length: 7 }, (_, i) => subDays(today, i))

      const solarPromises = dates.map(date =>
        DataLoader.loadSolarData(format(date, 'yyyy-MM-dd'))
      )

      const results = await Promise.all(solarPromises)

      const generationData: DataPoint[] = []
      const consumptionData: DataPoint[] = []

      results.forEach(dayData => {
        const genPoint = dayData.find(p => p.label?.includes('Generation'))
        const consPoint = dayData.find(p => p.label?.includes('Consumption'))

        if (genPoint) generationData.push(genPoint)
        if (consPoint) consumptionData.push(consPoint)
      })

      const generationSeries: DataSeries = {
        id: 'solar-gen',
        name: 'Solar Generation',
        data: generationData,
        type: 'area',
        color: '#10B981',
        unit: 'kWh'
      }

      const consumptionSeries: DataSeries = {
        id: 'power-cons',
        name: 'Power Consumption',
        data: consumptionData,
        type: 'line',
        color: '#EF4444',
        unit: 'kWh'
      }

      setDataSeries([generationSeries, consumptionSeries])
      setGraphTitle('Solar Generation vs Power Consumption - Last 7 Days')
    } catch (error) {
      console.error('Error loading solar data:', error)
      alert('Failed to load solar data. Make sure the solar API is running.')
    } finally {
      setLoading(false)
    }
  }

  const clearData = () => {
    setDataSources([])
    setDataSeries([])
    setGraphTitle('Data Visualization')
    setShowExamples(false)
  }

  const graphConfig: GraphConfig = {
    title: graphTitle,
    series: dataSeries,
    showLegend: true,
    showGrid: true
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Graphinator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Load and visualize data from CSV, JSON, or API sources
          </p>
        </header>

        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={loadExampleData}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Load Weather Example
          </button>
          <button
            onClick={loadSolarExample}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Load Solar Example
          </button>
          <button
            onClick={clearData}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Clear Data
          </button>
        </div>

        {!showExamples && (
          <DataSourceManager
            onAddSource={handleAddSource}
            sources={dataSources}
          />
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading data...</p>
          </div>
        )}

        {dataSeries.length > 0 && !loading && (
          <DataGraph config={graphConfig} />
        )}

        {dataSeries.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-900 p-12 rounded-lg shadow-lg text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No data to display. Add a data source or load an example to get started.
            </p>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          <h3 className="font-semibold mb-2">Supported Data Sources:</h3>
          <ul className="space-y-1">
            <li>• CSV files with configurable date and value columns</li>
            <li>• JSON files and API endpoints with data arrays</li>
            <li>• Open-Meteo weather API for climate data</li>
            <li>• Solar generation API at http://sungrow_api.localhost:3000</li>
          </ul>
        </div>
      </div>
    </div>
  )
}