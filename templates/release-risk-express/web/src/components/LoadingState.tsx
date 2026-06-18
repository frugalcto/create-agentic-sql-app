export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="state state--loading" role="status">
      {message}
    </div>
  );
}
