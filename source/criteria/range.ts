/**
 *
 * @example
 * [10..20]
 * [10..20)
 * (10..20]
 * (10..20)
 */
export function test(value: string): boolean {
  return /^[[(]\d+\.\.\d+[\])]{1}$/.test(value)
}

export function format(name: string, value: string): string[] {
  const [min, max] = value.slice(1, -1).split('..')

  return [
    `${name}${value.startsWith('(') ? '>' : '>='}${min}`,
    `${name}${value.endsWith(')') ? '<' : '<='}${max}`,
  ]
}
