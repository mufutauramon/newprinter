export function getErrorMessage(err: any) {
  const message = String(err?.message || err || "").toLowerCase();

  if (
    message.includes("network request failed") ||
    message.includes("failed to fetch")
  ) {
    return "No internet connection. Please check your network and try again.";
  }

  if (message.includes("invalid response")) {
    return "The server returned an unexpected response. Please try again.";
  }

  if (message.includes("timeout")) {
    return "The request took too long. Please try again.";
  }

  return err?.message || "Something went wrong. Please try again.";
}