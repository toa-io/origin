export interface Format {
  test(value: string): boolean
  format(name: string, value: string): string[]
}
