export default function Loading() {
  return (
    <div className="p-6 max-w-2xl mx-auto animate-pulse">
      <h1 className="text-2xl font-bold mb-6">Loading Notifications...</h1>
      <div className="space-y-4">
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        <div className="h-6 bg-gray-300 rounded w-1/2"></div>
        <div className="h-6 bg-gray-300 rounded w-2/3"></div>
      </div>
    </div>
  );
}
