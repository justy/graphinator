import type { NextApiRequest, NextApiResponse } from 'next'
import { DataLoader } from '@/lib/dataLoader'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { source, config } = req.body

      if (!source || !config) {
        return res.status(400).json({ error: 'Source and config are required' })
      }

      let data

      switch (source.type) {
        case 'weather':
          data = await DataLoader.loadWeatherData(
            source.latitude,
            source.longitude,
            source.startDate,
            source.endDate,
            source.variable
          )
          break

        case 'solar':
          data = await DataLoader.loadSolarData(source.date)
          break

        case 'api':
          data = await DataLoader.loadFromAPI(source.url, config)
          break

        default:
          return res.status(400).json({ error: 'Unsupported source type' })
      }

      res.status(200).json({
        success: true,
        data,
        count: data.length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Data API error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to load data',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else if (req.method === 'GET') {
    res.status(200).json({
      endpoints: {
        POST: {
          '/api/data': 'Load data from a source',
          body: {
            source: {
              type: 'weather | solar | api',
              '...sourceConfig': 'Source-specific configuration'
            },
            config: {
              timestampField: 'Field name for timestamp',
              valueField: 'Field name for value',
              dateFormat: 'Optional date format string'
            }
          }
        }
      }
    })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}