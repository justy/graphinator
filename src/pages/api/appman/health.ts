import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const uptime = process.uptime()
  const memoryUsage = process.memoryUsage()

  res.status(200).json({
    status: 'healthy',
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      unit: 'MB'
    },
    services: {
      api: 'operational',
      graphing: 'operational',
      data_import: 'operational'
    }
  })
}