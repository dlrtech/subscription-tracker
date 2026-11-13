import Icon from './Icon'

/** Brand mark: yellow tile with a wallet icon, followed by the name. */
export default function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-10 rounded-2xl' : 'size-9 rounded-xl'
  return (
    <span className="flex items-center gap-2 font-extrabold tracking-tight">
      <span aria-hidden="true" className={`${box} grid place-items-center bg-[#ffd93b] text-ink shadow-sm`}>
        <Icon name="wallet" className="size-5" />
      </span>
      <span>sub<span className="gradient-text">tracker</span></span>
    </span>
  )
}
