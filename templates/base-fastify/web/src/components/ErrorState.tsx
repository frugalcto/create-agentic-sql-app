export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state state--error" role="alert">
      {message}
    </div>
  );
}
