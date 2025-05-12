const settings: Partial<Settings> = {} as const

export function connect(set: Settings) {
  Object.assign(settings, set)
}

interface Settings {
  origin: string
  delay: number
}

export { settings }
