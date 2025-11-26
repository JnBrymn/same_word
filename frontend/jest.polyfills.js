// Polyfills that must be available before any imports
// This file runs before setupFilesAfterEnv, ensuring polyfills are available when MSW is imported

const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream, WritableStream } = require('stream/web')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.WritableStream = WritableStream

// Polyfill Response and Request for MSW v2
// These MUST be available before MSW is imported
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this._body = body
      this.ok = (init.status || 200) >= 200 && (init.status || 200) < 300
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new (global.Headers || Map)(init.headers)
    }
    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
    }
    async text() {
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
    }
  }
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.headers = new (global.Headers || Map)(init.headers)
    }
  }
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = new Map()
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value)
        })
      }
    }
    get(name) {
      return this._headers.get(name.toLowerCase())
    }
    set(name, value) {
      this._headers.set(name.toLowerCase(), value)
    }
  }
}

// Polyfill BroadcastChannel for MSW v2
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name
      this._listeners = []
    }
    postMessage(message) {
      // No-op for testing
    }
    addEventListener(type, listener) {
      this._listeners.push(listener)
    }
    removeEventListener(type, listener) {
      this._listeners = this._listeners.filter(l => l !== listener)
    }
    close() {
      this._listeners = []
    }
  }
}

