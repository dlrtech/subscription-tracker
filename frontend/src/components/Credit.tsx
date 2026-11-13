/** Small maker's mark shown at the bottom of the pages. */
export default function Credit({ className = '' }: { className?: string }) {
  return <p className={`text-center text-xs font-semibold muted ${className}`}>dlrtech tarafından yapıldı</p>
}
