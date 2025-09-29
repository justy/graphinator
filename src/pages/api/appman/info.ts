import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.status(200).json({
    name: 'Graphinator',
    version: '0.1.0',
    description: 'A general data grapher for visualizing time series data from multiple sources',
    capabilities: [
      'csv_import',
      'json_import',
      'api_integration',
      'time_series_visualization',
      'multi_source_comparison'
    ],
    status: 'running',
    port: 'dynamic',
    endpoints: {
      info: '/api/appman/info',
      health: '/api/appman/health',
      config: '/api/appman/config',
      data: '/api/data'
    }
  })
}