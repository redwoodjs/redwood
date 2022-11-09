import portfinder from 'portfinder'

/**
 * Finds a free port
 * @param  {[number]}   requestedPort Port to start searching from
 * @param  {[number[]]} excludePorts  Array of port numbers to exclude
 * @return {[number]}                 A free port equal or higher than requestedPort but not within excludePorts. If no port can be found then returns -1
 */
export async function getFreePort(requestedPort, excludePorts = []) {
  try {
    let freePort = await portfinder.getPortPromise({
      port: requestedPort,
    })
    if (excludePorts.includes(freePort)) {
      freePort = await getFreePort(freePort + 1, excludePorts)
    }
    return freePort
  } catch (error) {
    return -1
  }
}

/**
 * Determines if a port is available or in use
 * @param {number} port The port number to check
 * @return {boolean} True if the port is available, false otherwise
 */
export async function isPortFree(port) {
  return (await portfinder.getPortPromise({ port })) === port
}
