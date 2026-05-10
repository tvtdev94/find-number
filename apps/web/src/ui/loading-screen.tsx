export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center text-gray-400">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-yellow-400" />
        <span>{label}</span>
      </div>
    </div>
  )
}
