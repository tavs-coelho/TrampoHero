import React from 'react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  showValue = true,
  reviewCount,
}) => {
  const sizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const starSizeMap = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div
      className={`flex items-center gap-1 ${sizeMap[size]}`}
      aria-label={`Rating: ${rating.toFixed(1)} out of ${maxStars} stars`}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i + 1 <= Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <span key={i} className={`${starSizeMap[size]} ${filled || partial ? 'text-amber-400' : 'text-slate-200'}`}>
            {partial ? (
              <i className="fas fa-star-half-stroke"></i>
            ) : (
              <i className="fas fa-star"></i>
            )}
          </span>
        );
      })}
      {showValue && (
        <span className={`font-bold text-slate-700 ${sizeMap[size]}`}>{rating.toFixed(1)}</span>
      )}
      {reviewCount !== undefined && (
        <span className={`text-slate-400 ${sizeMap[size]}`}>({reviewCount})</span>
      )}
    </div>
  );
};
