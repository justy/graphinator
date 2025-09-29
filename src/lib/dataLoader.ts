import axios from 'axios'
import Papa from 'papaparse'
import { format, parse, isValid } from 'date-fns'
import { DataPoint, DataSource, TransformConfig } from '@/types/data'

export class DataLoader {
  static async loadFromCSV(file: File, config: TransformConfig): Promise<DataPoint[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = this.transformData(results.data, config)
            resolve(data)
          } catch (error) {
            reject(error)
          }
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  static async loadFromJSON(source: string | File, config: TransformConfig): Promise<DataPoint[]> {
    let data: any[]

    if (typeof source === 'string') {
      const response = await axios.get(source)
      data = Array.isArray(response.data) ? response.data : [response.data]
    } else {
      const text = await source.text()
      const parsed = JSON.parse(text)
      data = Array.isArray(parsed) ? parsed : [parsed]
    }

    return this.transformData(data, config)
  }

  static async loadFromAPI(
    url: string,
    config: TransformConfig,
    dateRange?: { start: Date; end: Date },
    maxPoints: number = 100
  ): Promise<DataPoint[]> {
    // Check if this is a date range request with URL template
    if (dateRange && url.includes('{{date}}')) {
      return this.loadDateRangeFromAPI(url, config, dateRange, maxPoints)
    }

    // Single API call - use proxy for localhost URLs to avoid CORS
    const finalUrl = this.getProxiedUrl(url)
    const response = await axios.get(finalUrl)
    const data = Array.isArray(response.data) ? response.data : [response.data]
    return this.transformData(data, config)
  }

  private static getProxiedUrl(url: string): string {
    // Check if this is a localhost URL that needs proxying
    if (url.includes('localhost:') || url.includes('127.0.0.1:')) {
      // Use our proxy endpoint
      return `/api/proxy?url=${encodeURIComponent(url)}`
    }
    return url
  }

  private static async loadDateRangeFromAPI(
    urlTemplate: string,
    config: TransformConfig,
    dateRange: { start: Date; end: Date },
    maxPoints: number = 100
  ): Promise<DataPoint[]> {
    const { start, end } = dateRange
    const urlDateFormat = config.urlDateFormat || 'yyyy-MM-dd'
    let allData: any[] = []

    // Generate dates for the range
    const startDate = new Date(start)
    const endDate = new Date(end)

    // Calculate total days in range
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Determine sampling strategy
    let dates: Date[] = []

    if (totalDays <= maxPoints) {
      // If total days is less than max points, fetch all days
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
      console.log(`📅 Fetching all ${dates.length} dates (within ${maxPoints} point limit)`)
    } else {
      // Sample dates evenly across the range
      const interval = totalDays / maxPoints
      for (let i = 0; i < maxPoints; i++) {
        const daysToAdd = Math.floor(i * interval)
        const sampleDate = new Date(startDate)
        sampleDate.setDate(sampleDate.getDate() + daysToAdd)
        if (sampleDate <= endDate) {
          dates.push(sampleDate)
        }
      }
      console.log(`📅 Sampling ${dates.length} dates from ${totalDays} total days (max ${maxPoints} points)`)
      console.log(`   Sampling interval: approximately every ${Math.ceil(interval)} days`)
    }

    // Fetch data sequentially with delays to avoid overwhelming the API
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    for (let index = 0; index < dates.length; index++) {
      const date = dates[index]

      // Add a small delay between each request to avoid overwhelming the API
      if (index > 0) {
        await delay(50) // 50ms delay between each request
      }
      try {
        // Format date according to URL format
        const formattedDate = format(date, urlDateFormat)
        const url = urlTemplate.replace('{{date}}', formattedDate)

        // Use proxy for localhost URLs to avoid CORS
        const finalUrl = this.getProxiedUrl(url)

        // Log the actual URL being called
        console.log(`🔍 Fetching: ${url}`)
        console.log(`   Via proxy: ${finalUrl}`)

        const response = await axios.get(finalUrl, {
          timeout: 5000  // 5 second timeout per request
          // Removed validateStatus to let axios handle all 2xx codes as success
        })

        let responseData = response.data

        // Validate response has data
        const dateStr = format(date, 'yyyy-MM-dd')
        if (!responseData || Object.keys(responseData).length === 0) {
          console.log(`⚪ Empty response for ${dateStr}`)
          return null
        }

        // Log successful fetch with value
        if (responseData[config.valueField]) {
          console.log(`✅ Got data for ${dateStr}: ${config.valueField}=${responseData[config.valueField]}`)
        } else {
          console.log(`⚪ Got response for ${dateStr} but no ${config.valueField} field`)
        }

        // Always use our generated date to ensure consistency
        // Override whatever date the API returns to avoid parsing issues
        // Set to midnight UTC to align with weather data
        const alignedDate = new Date(date)
        alignedDate.setUTCHours(0, 0, 0, 0)
        responseData = {
          ...responseData,
          [config.timestampField]: alignedDate.toISOString()
        }

        allData.push(responseData)
      } catch (error) {
        // Log all failures to help debug
        const dateStr = format(date, 'yyyy-MM-dd')
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            console.log(`📊 No data for ${dateStr}: 404 Not Found`)
          } else if (error.response?.status === 500) {
            console.log(`❌ No data for ${dateStr}: 500 Server Error`)
          } else if (error.code === 'ECONNREFUSED') {
            console.warn('Solar API is not running')
          } else {
            console.warn(`⚠️ Failed to fetch ${dateStr}: ${error.response?.status || error.code}`)
          }
        } else {
          console.error(`⚠️ Unexpected error for ${dateStr}:`, error)
        }
        // Continue to next date
      }
    }

    // Log summary
    console.log(`📊 Date Range Summary: ${allData.length} successful out of ${dates.length} total days`)

    // If we're sampling and have gaps, interpolate missing values
    if (dates.length > allData.length && allData.length >= 2) {
      console.log(`📈 Interpolating ${dates.length - allData.length} missing values`)
      allData = this.interpolateMissingData(allData, dates, config)
    }

    return this.transformData(allData, config)
  }

  private static interpolateMissingData(
    existingData: any[],
    targetDates: Date[],
    config: TransformConfig
  ): any[] {
    // Create a map of existing data by date
    const dataMap = new Map<string, any>()
    existingData.forEach(item => {
      const date = new Date(item[config.timestampField])
      const dateKey = format(date, 'yyyy-MM-dd')
      dataMap.set(dateKey, item)
    })

    // Sort existing data by date for interpolation
    const sortedData = existingData
      .map(item => ({
        ...item,
        date: new Date(item[config.timestampField])
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    // Build complete dataset with interpolation
    const result: any[] = []

    targetDates.forEach(targetDate => {
      const dateKey = format(targetDate, 'yyyy-MM-dd')
      const alignedDate = new Date(targetDate)
      alignedDate.setUTCHours(0, 0, 0, 0)

      if (dataMap.has(dateKey)) {
        // Use existing data
        result.push(dataMap.get(dateKey))
      } else {
        // Interpolate between nearest neighbors
        let before = null
        let after = null

        for (let i = 0; i < sortedData.length; i++) {
          if (sortedData[i].date < targetDate) {
            before = sortedData[i]
          } else if (sortedData[i].date > targetDate && !after) {
            after = sortedData[i]
            break
          }
        }

        if (before && after) {
          // Linear interpolation
          const totalTime = after.date.getTime() - before.date.getTime()
          const elapsed = targetDate.getTime() - before.date.getTime()
          const ratio = elapsed / totalTime

          const beforeValue = before[config.valueField] || 0
          const afterValue = after[config.valueField] || 0
          const interpolatedValue = beforeValue + (afterValue - beforeValue) * ratio

          result.push({
            [config.timestampField]: alignedDate.toISOString(),
            [config.valueField]: interpolatedValue,
            interpolated: true // Mark as interpolated
          })
        } else if (before) {
          // Use last known value (forward fill)
          result.push({
            [config.timestampField]: alignedDate.toISOString(),
            [config.valueField]: before[config.valueField] || 0,
            interpolated: true
          })
        } else if (after) {
          // Use next known value (backward fill)
          result.push({
            [config.timestampField]: alignedDate.toISOString(),
            [config.valueField]: after[config.valueField] || 0,
            interpolated: true
          })
        }
      }
    })

    return result.sort((a, b) =>
      new Date(a[config.timestampField]).getTime() -
      new Date(b[config.timestampField]).getTime()
    )
  }

  private static transformData(rawData: any[], config: TransformConfig): DataPoint[] {
    let filtered = rawData

    if (config.filter && config.filter.length > 0) {
      filtered = rawData.filter(item => {
        return config.filter!.every(filter => {
          const fieldValue = item[filter.field]

          switch (filter.operator) {
            case 'equals':
              return fieldValue === filter.value
            case 'contains':
              return String(fieldValue).includes(String(filter.value))
            case 'greater':
              return Number(fieldValue) > Number(filter.value)
            case 'less':
              return Number(fieldValue) < Number(filter.value)
            default:
              return true
          }
        })
      })
    }

    const points: DataPoint[] = filtered.map(item => {
      let timestamp: Date

      const timestampValue = item[config.timestampField]

      if (timestampValue instanceof Date) {
        timestamp = timestampValue
      } else if (typeof timestampValue === 'number') {
        timestamp = new Date(timestampValue)
      } else if (typeof timestampValue === 'string') {
        if (config.dateFormat) {
          timestamp = parse(timestampValue, config.dateFormat, new Date())
        } else {
          timestamp = new Date(timestampValue)
        }
      } else {
        timestamp = new Date()
      }

      if (!isValid(timestamp)) {
        timestamp = new Date()
      }

      return {
        timestamp,
        value: Number(item[config.valueField]) || 0,
        label: config.labelField ? String(item[config.labelField]) : undefined
      }
    })

    return points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  static async loadSolarData(date: string): Promise<DataPoint[]> {
    try {
      const formattedDate = format(new Date(date), 'ddMMyyyy')
      const response = await axios.get(`http://sungrow_api.localhost:3000/daily?date=${formattedDate}`)

      if (!response.data) {
        return []
      }

      const data = response.data
      const points: DataPoint[] = []

      if (data.generation) {
        points.push({
          timestamp: new Date(date),
          value: data.generation,
          label: 'Solar Generation (kWh)'
        })
      }

      if (data.consumption) {
        points.push({
          timestamp: new Date(date),
          value: data.consumption,
          label: 'Power Consumption (kWh)'
        })
      }

      return points
    } catch (error) {
      console.error('Error loading solar data:', error)
      return []
    }
  }

  static async loadWeatherData(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    variable: string = 'temperature_2m_max',
    maxPoints: number = 100
  ): Promise<DataPoint[]> {
    try {
      // Use historical API for past dates, forecast API for future dates
      const today = new Date()
      const start = new Date(startDate)
      const isHistorical = start < today

      const baseUrl = isHistorical
        ? 'https://archive-api.open-meteo.com/v1/archive'
        : 'https://api.open-meteo.com/v1/forecast'

      const url = `${baseUrl}?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=${variable}&timezone=auto`
      console.log(`🌤️ Fetching weather from: ${url}`)
      const response = await axios.get(url)

      if (!response.data || !response.data.daily) {
        console.log('⚠️ No daily data in weather response')
        return []
      }

      const daily = response.data.daily
      const times = daily.time || []
      const values = daily[variable] || []

      console.log(`🌤️ Weather response: ${times.length} days, first value: ${values[0]}, last value: ${values[values.length - 1]}`)

      const points = times.map((time: string, index: number) => {
        // Ensure weather timestamps are at midnight UTC
        const timestamp = new Date(time)
        timestamp.setUTCHours(0, 0, 0, 0)
        return {
          timestamp,
          value: values[index] || 0,
          label: variable.replace(/_/g, ' ')
        }
      })

      console.log(`🌤️ Converted to ${points.length} data points`)
      return points
    } catch (error) {
      console.error('Error loading weather data:', error)
      return []
    }
  }
}