export function LoadingIndicator() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="text-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-black rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">Loading LO...</p>
      </div>
    </div>
  )
}
