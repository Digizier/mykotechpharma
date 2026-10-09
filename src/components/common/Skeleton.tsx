'use client';

import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`flash-skeleton rounded-lg ${className}`} />;
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col gap-3">
      <Skeleton className="w-full h-44 rounded-xl" />
      <Skeleton className="w-1/3 h-4" />
      <Skeleton className="w-3/4 h-5" />
      <Skeleton className="w-1/2 h-3" />
      <div className="flex items-center justify-between pt-2 mt-auto">
        <Skeleton className="w-1/3 h-6" />
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
    </div>
  );
};

export const CategoryPillSkeleton: React.FC = () => {
  return <Skeleton className="h-10 w-28 rounded-full" />;
};
