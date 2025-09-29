const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const AppmanClient = require('/Users/justy/code/Justy/devops/appman/client/node/appman-client.js')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'

let appInstance = null
let server = null
let appman = null

async function startServer() {
  // Initialize Appman client
  appman = new AppmanClient({
    name: 'graphinator',
    description: 'A general data grapher for visualizing time series data from multiple sources',
    launchCommand: 'npm run dev',
    workingDirectory: process.cwd()
  })

  // Define API endpoints for Appman documentation
  appman.defineEndpoints([
    {
      path: '/api/appman/info',
      method: 'GET',
      description: 'Get application information'
    },
    {
      path: '/api/appman/health',
      method: 'GET',
      description: 'Health check endpoint'
    },
    {
      path: '/api/appman/config',
      method: 'GET',
      description: 'Get application configuration'
    },
    {
      path: '/api/data',
      method: 'POST',
      description: 'Load data from a source',
      requestBody: {
        example: {
          source: {
            type: 'weather',
            latitude: 37.7749,
            longitude: -122.4194,
            startDate: '2024-01-01',
            endDate: '2024-01-07',
            variable: 'temperature_2m_max'
          },
          config: {
            timestampField: 'time',
            valueField: 'temperature_2m_max'
          }
        }
      }
    },
    {
      path: '/api/data',
      method: 'GET',
      description: 'Get data API documentation'
    }
  ])

  // Register with Appman and get port
  let port
  try {
    const registration = await appman.register()
    port = registration.port
    console.log(`✓ Registered with Appman as 'graphinator' on port ${port}`)
    console.log(`✓ Access at http://graphinator.localhost:${port}`)
  } catch (error) {
    console.log('ℹ Appman not available, using fallback port 3000')
    port = 3000
  }

  // Initialize Next.js app with the assigned port
  appInstance = next({ dev, hostname, port })
  const handle = appInstance.getRequestHandler()

  await appInstance.prepare()

  server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)

      // Handle health endpoint for Appman
      if (parsedUrl.pathname === '/health') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ status: 'healthy' }))
        return
      }

      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  server.once('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  server.listen(port, () => {
    console.log(`> Graphinator ready on http://${hostname}:${port}`)
  })
}

// Handle graceful shutdown
async function shutdown() {
  console.log('Shutting down Graphinator...')

  if (server) {
    server.close()
  }

  if (appman) {
    await appman.deregister()
    console.log('✓ Deregistered from Appman')
  }

  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Start the server
startServer().catch(console.error)