'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  user: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
  images?: string[];
}

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  onLoadMore: () => void;
  hasMore: boolean;
  className?: string;
}

export function ProductReviews({
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution,
  onLoadMore,
  hasMore,
  className
}: ProductReviewsProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'helpful'>('newest');
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());

  const filteredReviews = reviews
    .filter(review => filterRating === null || review.rating === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'helpful':
          return b.helpful - a.helpful;
        default:
          return 0;
      }
    });

  const handleHelpful = (reviewId: string) => {
    setHelpfulReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const getRatingPercentage = (rating: number) => {
    if (totalReviews === 0) return 0;
    return (ratingDistribution[rating as keyof typeof ratingDistribution] / totalReviews) * 100;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Reviews Header */}
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Đánh giá khách hàng</h2>
        
        {/* Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Rating */}
          <div className="text-center md:text-left">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center md:justify-start mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-5 h-5',
                    i < Math.floor(averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <p className="text-gray-600">Dựa trên {totalReviews} đánh giá</p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 w-8">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${getRatingPercentage(rating)}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {ratingDistribution[rating as keyof typeof ratingDistribution]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Rating Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Lọc theo đánh giá:</span>
          <div className="flex space-x-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                className={cn(
                  'flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors',
                  filterRating === rating
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Star className="w-3 h-3" />
                <span>{rating}</span>
              </button>
            ))}
            {filterRating && (
              <button
                onClick={() => setFilterRating(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Sắp xếp theo:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="helpful">Phổ biến nhất</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <div key={review.id} className="border-b pb-6 last:border-b-0">
            {/* Review Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {review.user.avatar ? (
                    <img
                      src={review.user.avatar}
                      alt={review.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {review.user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                    {review.verified && (
                      <Badge variant="secondary" className="text-xs">
                        Đã mua
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            {/* Review Content */}
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">{review.title}</h5>
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              
              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex space-x-2">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-md cursor-pointer hover:opacity-80"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Review Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className={cn(
                    'flex items-center space-x-1 text-sm transition-colors',
                    helpfulReviews.has(review.id)
                      ? 'text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Hữu ích ({review.helpful})</span>
                </button>
                <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
                  <ThumbsDown className="w-4 h-4" />
                  <span>Không hữu ích</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={onLoadMore}>
            Xem thêm đánh giá
          </Button>
        </div>
      )}

      {/* No Reviews */}
      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đánh giá</h3>
          <p className="text-gray-500">
            {filterRating ? 'Không tìm thấy đánh giá phù hợp.' : 'Hãy là người đầu tiên đánh giá sản phẩm này!'}
          </p>
        </div>
      )}
    </div>
  );
}
