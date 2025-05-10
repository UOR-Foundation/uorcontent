import ContentList from '../../components/ContentList';

export const dynamic = 'force-dynamic';

export default function ConceptsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-8">UOR Concepts</h1>
        
        <p className="mb-8">
          Browse and manage UOR concepts using Schema.org DefinedTerm type.
          Concepts represent defined terms in the UOR Framework.
        </p>
        
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <ContentList contentType="concepts" title="All Concepts" />
        </div>
      </div>
    </main>
  );
}
