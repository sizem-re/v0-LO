export default function TestFramePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Frame Authentication Test</h1>
        <p className="text-gray-600 mb-4">
          This page can be used to test Frame authentication. When shared in Warpcast, 
          users should be able to authenticate by clicking the "Open LO" button in the Frame.
        </p>
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>How to test:</strong>
            <br />
            1. Share this URL in Warpcast
            <br />
            2. Click the "Open LO" button in the Frame
            <br />
            3. You should be automatically authenticated and redirected to the main app
          </p>
        </div>
      </div>
    </div>
  )
} 