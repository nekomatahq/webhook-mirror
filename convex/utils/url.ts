/**
 * Utility functions for URL validation
 */

import { ConvexError } from "convex/values";

/**
 * Checks if a hostname is localhost or a private IP address
 */
export function isLocalhostOrPrivateIP(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  // Check for localhost
  if (
    lowerHostname === "localhost" ||
    lowerHostname === "127.0.0.1" ||
    lowerHostname === "::1"
  ) {
    return true;
  }

  // Check for private IP ranges
  // 192.168.0.0/16
  if (lowerHostname.startsWith("192.168.")) {
    return true;
  }

  // 10.0.0.0/8
  if (lowerHostname.startsWith("10.")) {
    return true;
  }

  // 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
  if (lowerHostname.startsWith("172.")) {
    const parts = lowerHostname.split(".");
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (!isNaN(secondOctet) && secondOctet >= 16 && secondOctet <= 31) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates a URL and checks if it's accessible from Convex actions
 * @throws ConvexError if URL is invalid or points to localhost/private IP
 */
export function validateReplayUrl(urlString: string): URL {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    throw new ConvexError("Invalid target URL. Please provide a valid URL.");
  }

  if (isLocalhostOrPrivateIP(parsedUrl.hostname)) {
    throw new ConvexError(
      "Cannot replay to localhost or private IP addresses. Convex actions run in the cloud and cannot access local resources. Use a public URL or a tunnel service like ngrok for localhost testing."
    );
  }

  return parsedUrl;
}

