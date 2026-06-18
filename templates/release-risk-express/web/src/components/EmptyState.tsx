export function EmptyState({
  message = "No release items to display.",
}: {
  message?: string;
}) {
  return (
    <div className="state state--empty" role="status">
      {message}
    </div>
  );
}
