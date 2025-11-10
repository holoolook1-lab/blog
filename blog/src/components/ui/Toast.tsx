export default function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-2 rounded"
    >
      {message}
    </div>
  );
}