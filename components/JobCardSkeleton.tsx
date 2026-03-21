import React from 'react';
import { Skeleton } from './Skeleton';

export const JobCardSkeleton: React.FC = () => (
  <div data-testid="job-card-skeleton" className="bg-white p-4 rounded-xl border border-slate-200">
    <div className="flex justify-between items-start mb-2">
      <Skeleton className="h-3 w-16 rounded" />
      <Skeleton className="h-4 w-16 rounded" />
    </div>
    <Skeleton className="h-4 w-3/4 rounded mt-2" />
    <div className="flex items-center gap-3 mt-3">
      <Skeleton className="h-3 w-24 rounded" />
      <Skeleton className="h-3 w-20 rounded" />
    </div>
  </div>
);
