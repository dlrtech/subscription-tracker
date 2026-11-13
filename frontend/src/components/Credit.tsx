/** Small maker's mark shown at the bottom of the pages. */
export default function Credit({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-xs font-semibold muted ${className}`}>
      <a href="https://github.com/dlrtech" target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center underline hover:text-ink">dlrtech tarafından yapıldı</a>
    </p>
  )
}
