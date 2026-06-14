export function EmptyState({
  message = "No release items to display.",
}: {
  message?: string;
}) {
  return <p role="status">{message}</p>;
}
