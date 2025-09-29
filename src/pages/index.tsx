import React, { useState, useEffect } from 'react'
import DataGraph from '@/components/DataGraph'
import DataSourceManager from '@/components/DataSourceManager'
import ExampleManager from '@/components/ExampleManager'
import { DataLoader } from '@/lib/dataLoader'
import { DataSource, DataSeries, GraphConfig, DataPoint, TransformConfig, DateRange } from '@/types/data'
import { Example, ExampleDataSource, PREDEFINED_EXAMPLES } from '@/types/examples'
import { format, subDays } from 'date-fns'

export default function Home() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [dataSeries, setDataSeries] = useState<DataSeries[]>([])
  const [loading, setLoading] = useState(false)
  const [graphTitle, setGraphTitle] = useState('Data Visualization')
  const [showExamples, setShowExamples] = useState(false)
  const [showExampleManager, setShowExampleManager] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date()
  })
  const [maxDataPoints, setMaxDataPoints] = useState(100)

  const handleAddSource = async (source: DataSource) => {
    setDataSources([...dataSources, source])
    await loadDataForSource(source)
  }

  const loadDataForSource = async (source: DataSource) => {
    setLoading(true)

    try {
      let data: DataPoint[] = []

      if (source.type === 'csv' && source.file && source.transformConfig) {
        data = await DataLoader.loadFromCSV(source.file, source.transformConfig)
      } else if (source.type === 'json' && source.file && source.transformConfig) {
        data = await DataLoader.loadFromJSON(source.file, source.transformConfig)
      } else if (source.type === 'api' && source.url && source.transformConfig) {
        data = await DataLoader.loadFromAPI(source.url, source.transformConfig, dateRange, maxDataPoints)
      }

      const newSeries: DataSeries = {
        id: source.id,
        name: source.name,
        data,
        type: 'line'
      }

      // Update or add the series
      setDataSeries(prev => {
        const filtered = prev.filter(s => s.id !== source.id)
        return [...filtered, newSeries]
      })
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data source. Please check your configuration.')
    } finally {
      setLoading(false)
    }
  }

  const [currentExampleName, setCurrentExampleName] = useState<string | null>(null)

  const reloadAllSources = async () => {
    // Check if we're showing examples
    if (showExamples && currentExampleName) {
      // Reload the current example with new date range
      setLoading(true)

      // Determine which example to reload based on the current title
      if (currentExampleName.includes('Solar Generation vs Temperature')) {
        await loadSolarVsTemperatureExample()
      } else if (currentExampleName.includes('Solar vs Consumption')) {
        await loadSolarVsConsumptionExample()
      } else if (currentExampleName.includes('Solar Generation') && !currentExampleName.includes('vs')) {
        await loadSolarExample()
      } else if (currentExampleName.includes('Weather')) {
        await loadExampleData()
      }
      return
    }

    // Otherwise reload custom data sources
    if (dataSources.length === 0) return

    setLoading(true)
    setDataSeries([])

    try {
      for (const source of dataSources) {
        await loadDataForSource(source)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadExampleData = async () => {
    setLoading(true)
    setShowExamples(true)
    setCurrentExampleName('Coledale Weather')

    try {
      // Use the graph's date range instead of hardcoded dates
      const weatherData = await DataLoader.loadWeatherData(
        -34.4278,  // Coledale, NSW, Australia latitude
        150.9451,  // Coledale, NSW, Australia longitude
        format(dateRange.start, 'yyyy-MM-dd'),
        format(dateRange.end, 'yyyy-MM-dd'),
        'temperature_2m_max',
        maxDataPoints
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
        -34.4278,  // Coledale, NSW, Australia latitude
        150.9451,  // Coledale, NSW, Australia longitude
        format(dateRange.start, 'yyyy-MM-dd'),
        format(dateRange.end, 'yyyy-MM-dd'),
        'precipitation_sum',
        maxDataPoints
      )

      const precipSeries: DataSeries = {
        id: 'weather-precip',
        name: 'Precipitation (mm)',
        data: precipData,
        type: 'bar',
        color: '#3B82F6',
        unit: 'mm'
      }

      // setDataSeries([weatherSeries, precipSeries])
      setDataSeries([weatherSeries])

      // Update title to reflect the actual date range
      const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
      setGraphTitle(`Coledale Weather - ${days} Days`)
    } catch (error) {
      console.error('Error loading example data:', error)
      alert('Failed to load example data')
    } finally {
      setLoading(false)
    }
  }

  const loadSolarVsTemperatureExample = async () => {
    const example = PREDEFINED_EXAMPLES.find(e => e.id === 'solar-vs-temperature')
    if (example) {
      await loadExampleFromManager(example)
    }
  }

  const loadSolarVsConsumptionExample = async () => {
    const example = PREDEFINED_EXAMPLES.find(e => e.id === 'solar-consumption')
    if (example) {
      await loadExampleFromManager(example)
    }
  }

  const loadSolarExample = async () => {
    setLoading(true)
    setShowExamples(true)
    setCurrentExampleName('Solar Generation')

    // Clear previous data to ensure consistency
    setDataSeries([])

    try {
      // Use the graph's date range
      const urlTemplate = 'http://sungrow_api.localhost:3000/daily?date={{date}}'
      const config: TransformConfig = {
        timestampField: 'date',
        valueField: 'generated',
        urlDateFormat: 'ddMMyyyy'
      }

      const data = await DataLoader.loadFromAPI(urlTemplate, config, dateRange, maxDataPoints)

      // Only set data if we got valid results
      if (data && data.length > 0) {
        const generationSeries: DataSeries = {
          id: 'solar-gen',
          name: 'Solar Generation',
          data,
          type: 'area',
          color: '#10B981',
          unit: 'kWh'
        }

        setDataSeries([generationSeries])
        const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
        setGraphTitle(`Solar Generation - ${days} Days (${data.length} days with data)`)
      } else {
        alert('No solar data available for the selected period')
        setDataSeries([])
      }
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
    setCurrentExampleName(null)
  }

  const loadExampleFromManager = async (example: Example) => {
    setLoading(true)
    setShowExamples(true)
    setDataSeries([])

    try {
      const allSeries: DataSeries[] = []

      for (const dataSource of example.dataSources) {
        console.log(`📊 Processing data source: ${dataSource.name}`, {
          id: dataSource.id,
          hasLatitude: !!dataSource.latitude,
          hasLongitude: !!dataSource.longitude,
          hasWeatherVariable: !!dataSource.weatherVariable,
          hasUrlTemplate: !!dataSource.urlTemplate,
          hasStaticUrl: !!dataSource.staticUrl,
          fullDataSource: dataSource
        })

        let data: DataPoint[] = []

        if (dataSource.latitude && dataSource.longitude && dataSource.weatherVariable) {
          // Weather data source
          console.log(`🌤️ Loading weather data: ${dataSource.weatherVariable} for ${dataSource.latitude}, ${dataSource.longitude}`)
          data = await DataLoader.loadWeatherData(
            dataSource.latitude,
            dataSource.longitude,
            format(dateRange.start, 'yyyy-MM-dd'),
            format(dateRange.end, 'yyyy-MM-dd'),
            dataSource.weatherVariable,
            maxDataPoints
          )
          console.log(`🌤️ Weather data loaded: ${data.length} points`)
        } else if (dataSource.urlTemplate) {
          // API with date template
          console.log(`🔗 Loading from URL template: ${dataSource.urlTemplate}`)
          data = await DataLoader.loadFromAPI(
            dataSource.urlTemplate,
            dataSource.config,
            dateRange,
            maxDataPoints
          )
        } else if (dataSource.staticUrl) {
          // Static API endpoint
          console.log(`📡 Loading from static URL: ${dataSource.staticUrl}`)
          data = await DataLoader.loadFromAPI(
            dataSource.staticUrl,
            dataSource.config
          )
        } else {
          console.warn(`⚠️ No valid data source configuration found for ${dataSource.name}`)
        }

        const series: DataSeries = {
          id: dataSource.id,
          name: dataSource.name,
          data,
          type: dataSource.chartType || 'line',
          color: dataSource.color,
          unit: dataSource.name.includes('°C') ? '°C' :
                dataSource.name.includes('kWh') ? 'kWh' :
                dataSource.name.includes('mm') ? 'mm' : undefined
        }

        allSeries.push(series)
      }

      console.log('📊 Loaded series:', allSeries.map(s => ({
        name: s.name,
        dataPoints: s.data.length,
        firstValue: s.data[0]?.value,
        lastValue: s.data[s.data.length - 1]?.value
      })))

      setDataSeries(allSeries)
      setGraphTitle(example.name)
      setCurrentExampleName(example.name)
    } catch (error) {
      console.error('Error loading example:', error)
      alert('Failed to load example data')
    } finally {
      setLoading(false)
    }
  }

  const graphConfig: GraphConfig = {
    title: graphTitle,
    series: dataSeries,
    showLegend: true,
    showGrid: true
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {showExampleManager && (
        <ExampleManager
          onLoadExample={loadExampleFromManager}
          onClose={() => setShowExampleManager(false)}
        />
      )}
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
            onClick={() => setShowExampleManager(true)}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            📊 Examples
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

        {/* Date Range Controls */}
        {(dataSources.length > 0 || showExamples) && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Date Range for Graph
            </h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={format(dateRange.start, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value)
                    if (newDate < dateRange.end) {
                      setDateRange({ ...dateRange, start: newDate })
                    }
                  }}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={format(dateRange.end, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value)
                    if (newDate > dateRange.start) {
                      setDateRange({ ...dateRange, end: newDate })
                    }
                  }}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Data Points
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={maxDataPoints}
                  onChange={(e) => setMaxDataPoints(Math.min(500, Math.max(10, parseInt(e.target.value) || 100)))}
                  className="w-24 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <button
                onClick={reloadAllSources}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Update Graph
              </button>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(() => {
                  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                  if (totalDays <= maxDataPoints) {
                    return `Date range spans ${totalDays} days - all data will be fetched`
                  } else {
                    const interval = Math.ceil(totalDays / maxDataPoints)
                    return `Date range spans ${totalDays} days - sampling every ~${interval} days to stay within ${maxDataPoints} point limit`
                  }
                })()}
              </p>
            </div>
          </div>
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