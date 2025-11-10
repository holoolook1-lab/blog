export default function LoadingDetail() {
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="h-7 w-2/3 bg-gray-200 animate-pulse rounded" />
      <div className="w-full aspect-[16/9] bg-gray-100 animate-pulse rounded" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 w-full bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    </main>
  );
}