'use client'

import { useState } from 'react'

export default function Home() {
  const [response, setResponse] = useState('')

  const handlePing = async () => {
    try {
      const res = await fetch('http://localhost:8000/ping')
      const data = await res.json()
      setResponse(data.message)
    } catch (error) {
      setResponse('Error: Could not connect to backend')
    }
  }

  return (
    <main style={{ padding: '50px', fontFamily: 'Arial, sans-serif' }}>
      <button 
        onClick={handlePing}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        ping
      </button>
      <div style={{ marginTop: '20px' }}>
        <input
          type="text"
          value={response}
          readOnly
          style={{
            padding: '10px',
            fontSize: '16px',
            width: '300px'
          }}
        />
      </div>
    </main>
  )
}

