import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      app: {
        name: 'Graphinator',
        environment: process.env.NODE_ENV || 'development',
        port: 'dynamic',
        baseUrl: 'dynamic'
      },
      features: {
        csvImport: true,
        jsonImport: true,
        apiIntegration: true,
        realtimeUpdates: false,
        dataExport: false
      },
      limits: {
        maxDataPoints: 10000,
        maxSeries: 10,
        maxFileSize: '10MB'
      },
      integrations: {
        openMeteo: {
          enabled: true,
          baseUrl: 'https://api.open-meteo.com/v1'
        },
        solarApi: {
          enabled: true,
          baseUrl: 'http://sungrow_api.localhost:3000'
        }
      }
    })
  } else if (req.method === 'PUT') {
    res.status(200).json({
      message: 'Configuration update not implemented in this version',
      success: false
    })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}