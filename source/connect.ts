const settings: Partial<Settings> = {} as const

export function connect(values: Settings) {
  Object.assign(settings, values)

  if (settings.delay) console.warn(`API delay is enabled (${settings.delay}ms)`)
}

interface Settings {
  origin: string
  delay?: number
}

export { settings }
