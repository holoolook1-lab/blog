export default function Loading() {
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
      <ul className="grid gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="border rounded overflow-hidden">
            <div className="w-full aspect-[16/9] bg-gray-100 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-2/3 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-5/6 bg-gray-200 animate-pulse rounded" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}