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

  // 1. Check if target URL is provided and is a valid string
  if (typeof targetUrl !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid target URL. Usage: /api/proxy?url=https://example.com/api'
    })
  }

  try {
    // 2. Prepare the request options based on the incoming request
    const headers: Record<string, string> = {}

    // Forward important headers if present
    if (typeof req.headers['content-type'] === 'string') {
      headers['content-type'] = req.headers['content-type']
    }
    if (typeof req.headers['authorization'] === 'string') {
      headers['authorization'] = req.headers['authorization']
    }

    // Specially handle headers for nseindia.com to prevent blocking
    if (targetUrl.includes('nseindia.com')) {
      headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      headers['sec-fetch-site'] = 'same-origin'
      headers['referer'] = 'https://www.nseindia.com/'
      headers['accept'] = '*/*'
      headers['accept-language'] = 'en-US,en;q=0.9'
    } else if (typeof req.headers['user-agent'] === 'string') {
      headers['user-agent'] = req.headers['user-agent']
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Proxy Error:', errorMessage)
    res.status(500).json({
      error: 'Failed to proxy request',
      details: errorMessage
    })
  }
})

// Home route
app.get('/', (req, res) => {
  res.type('html').send(`<h1>Proxy API is running 🚀</h1>`)
})

export default app
