export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return <p role="status">{message}</p>;
}
