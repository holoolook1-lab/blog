export default function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white text-gray-700 px-3 py-2 rounded border border-gray-200 shadow-lg"
    >
      {message}
    </div>
  );
}