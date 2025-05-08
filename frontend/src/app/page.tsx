export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">UOR Content Management</h1>
        
        <p className="mb-4">
          Welcome to the UOR Content Management frontend. This application provides a modern interface
          for interacting with the UOR Framework content.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="border border-gray-300 rounded-lg p-6 hover:bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Concepts</h2>
            <p className="text-gray-600 mb-4">
              Browse and manage UOR concepts using Schema.org DefinedTerm type.
            </p>
            <a 
              href="/concepts" 
              className="text-blue-600 hover:underline"
            >
              Explore Concepts
            </a>
          </div>
          
          <div className="border border-gray-300 rounded-lg p-6 hover:bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Predicates</h2>
            <p className="text-gray-600 mb-4">
              Browse and manage UOR predicates using Schema.org PropertyValue type.
            </p>
            <a 
              href="/predicates" 
              className="text-blue-600 hover:underline"
            >
              Explore Predicates
            </a>
          </div>
          
          <div className="border border-gray-300 rounded-lg p-6 hover:bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Resources</h2>
            <p className="text-gray-600 mb-4">
              Browse and manage UOR resources using Schema.org CreativeWork type.
            </p>
            <a 
              href="/resources" 
              className="text-blue-600 hover:underline"
            >
              Explore Resources
            </a>
          </div>
          
          <div className="border border-gray-300 rounded-lg p-6 hover:bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Topics</h2>
            <p className="text-gray-600 mb-4">
              Browse and manage UOR topics using Schema.org CreativeWork type.
            </p>
            <a 
              href="/topics" 
              className="text-blue-600 hover:underline"
            >
              Explore Topics
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
