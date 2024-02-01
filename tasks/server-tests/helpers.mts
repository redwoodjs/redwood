export function sleep(time = 1_000) {
  return new Promise(resolve => setTimeout(resolve, time));
}
