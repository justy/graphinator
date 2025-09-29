import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  try {
    // Decode the URL (it comes encoded from the query parameter)
    const targetUrl = decodeURIComponent(url)

    console.log('Proxying request to:', targetUrl)

    const response = await axios.get(targetUrl, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      },
      // Don't throw on any status, handle it ourselves
      validateStatus: () => true
    })

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // Log the response status for debugging
    if (response.status !== 200) {
      console.log(`Proxy: Upstream returned ${response.status} for ${targetUrl}`)
      console.log(`Response data:`, response.data)
    }

    // Always return the data if we got any, regardless of status
    if (response.data) {
      res.status(200).json(response.data)
    } else {
      res.status(response.status).json({ error: `Empty response from upstream` })
    }
  } catch (error) {
    console.error('Proxy error:', error)

    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json({
          error: `Upstream server error: ${error.response.status}`,
          message: error.message
        })
      } else if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'Service unavailable',
          message: 'Cannot connect to the upstream server'
        })
      } else {
        res.status(500).json({
          error: 'Proxy error',
          message: error.message
        })
      }
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      })
    }
  }
}