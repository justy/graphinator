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

  static async loadFromAPI(url: string, config: TransformConfig): Promise<DataPoint[]> {
    const response = await axios.get(url)
    const data = Array.isArray(response.data) ? response.data : [response.data]
    return this.transformData(data, config)
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
    variable: string = 'temperature_2m_max'
  ): Promise<DataPoint[]> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=${variable}`
      const response = await axios.get(url)

      if (!response.data || !response.data.daily) {
        return []
      }

      const daily = response.data.daily
      const times = daily.time || []
      const values = daily[variable] || []

      return times.map((time: string, index: number) => ({
        timestamp: new Date(time),
        value: values[index] || 0,
        label: variable.replace(/_/g, ' ')
      }))
    } catch (error) {
      console.error('Error loading weather data:', error)
      return []
    }
  }
}