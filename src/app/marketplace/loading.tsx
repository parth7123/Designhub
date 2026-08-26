import { ListingGridSkeleton } from '../../components/ui/Skeletons';

export default function MarketplaceLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="space-y-3 mb-8 animate-fade-in">
        <div className="skeleton h-9 w-64" />
        <div className="skeleton h-4 w-96" />
      </div>
      {/* Filters + Grid */}
      <div className="flex gap-6">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-64 shrink-0 space-y-4 animate-fade-in">
          <div className="skeleton h-6 w-32" />
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton h-10 w-full rounded-xl" />
          ))}
          <div className="skeleton h-px w-full mt-4" />
          <div className="skeleton h-6 w-28" />
          {[1,2,3].map(i => (
            <div key={i} className="skeleton h-10 w-full rounded-xl" />
          ))}
        </div>
        {/* Grid */}
        <div className="flex-1">
          <ListingGridSkeleton count={12} />
        </div>
      </div>
    </div>
  );
}
