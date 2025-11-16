export default function AppLoading() {
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 w-full bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    </main>
  );
}