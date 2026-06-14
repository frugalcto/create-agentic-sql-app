export interface InteractiveStream {
  isTTY?: boolean;
}

export function isInteractive(
  stream: InteractiveStream = process.stdin,
): boolean {
  return Boolean(stream.isTTY);
}
