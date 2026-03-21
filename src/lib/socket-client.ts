import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

function resolveSocketUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL

  if (typeof window === "undefined") {
    return configuredUrl ?? "http://localhost:3001"
  }

  const { protocol, hostname } = window.location
  const fallbackUrl = `${protocol}//${hostname}:3001`

  if (!configuredUrl) return fallbackUrl

  try {
    const parsed = new URL(configuredUrl)
    const currentIsLocalhost = hostname === "localhost" || hostname === "127.0.0.1"
    const configuredIsLocalhost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"

    if (!currentIsLocalhost && configuredIsLocalhost) {
      return fallbackUrl
    }
  } catch {
    return configuredUrl
  }

  return configuredUrl
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      autoConnect: false,
    })
  }
  return socket
}
