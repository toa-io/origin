type Events = {
  challenge: string,
  error: { code: number, body: unknown },
  response: { status: number, headers: Headers }
}

export { Events }
