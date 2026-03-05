import React from 'react';
import { Skeleton } from './Skeleton';

export const JobCardSkeleton: React.FC = () => (
  <div data-testid="job-card-skeleton" className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <Skeleton className="h-3 w-20 rounded-full" />
      <Skeleton className="h-5 w-16 rounded" />
    </div>
    <Skeleton className="h-6 w-3/4 rounded mt-2" />
    <div className="flex items-center gap-3 mt-3">
      <Skeleton className="h-3 w-28 rounded-full" />
      <Skeleton className="h-3 w-12 rounded-full" />
    </div>
  </div>
);
