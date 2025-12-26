import './Skeleton.css';

export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img shimmer"></div>
      <div className="skeleton-text shimmer"></div>
      <div className="skeleton-text small shimmer"></div>
    </div>
  );
}
