import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Enable All CORS Requests
app.use(cors())

// Parse JSON bodies
app.use(express.json())

// Dynamic Proxy Route (Supports GET, POST, PUT, DELETE, etc.)
app.all('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url

  // 1. Check if target URL is provided
  if (!targetUrl) {
    return res.status(400).json({ 
      error: 'Missing target URL. Usage: /api/proxy?url=https://example.com/api' 
    })
  }

  try {
    // 2. Prepare the request options based on the incoming request
    const fetchOptions = {
      method: req.method,
      headers: {}
    }

    // Forward important headers if present
    if (req.headers['content-type']) {
      fetchOptions.headers['content-type'] = req.headers['content-type']
    }
    if (req.headers['authorization']) {
      fetchOptions.headers['authorization'] = req.headers['authorization']
    }

    // 3. Attach the body if it's a POST, PUT, or PATCH request
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body
    }

    // 4. Send the request to the target endpoint
    const response = await fetch(targetUrl, fetchOptions)
    const rawData = await response.text()

    // 5. Forward the status code and return the data
    res.status(response.status)

    try {
      // Return as JSON if the response is valid JSON
      res.json(JSON.parse(rawData))
    } catch {
      // Otherwise return as plain text/HTML
      res.send(rawData)
    }

  } catch (error) {
    console.error('Proxy Error:', error.message)
    res.status(500).json({ 
      error: 'Failed to proxy request', 
      details: error.message 
    })
  }
})

// Home route
app.get('/', (req, res) => {
  res.type('html').send(`<h1>Proxy API is running 🚀</h1>`)
})

export default app
