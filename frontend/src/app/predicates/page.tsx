import ContentList from '../../components/ContentList';

export default function PredicatesPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-8">UOR Predicates</h1>
        
        <p className="mb-8">
          Browse and manage UOR predicates using Schema.org PropertyValue type.
          Predicates define relationships between concepts in the UOR Framework.
        </p>
        
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <ContentList contentType="predicates" title="All Predicates" />
        </div>
      </div>
    </main>
  );
}
