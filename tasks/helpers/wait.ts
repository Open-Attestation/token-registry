export const wait = async (durationMs: number) =>
  new Promise((resolve) => setTimeout(async () => resolve(true), durationMs));
