import { cn } from '@/lib/utils'

type InitialAvatarProps = {
  label: string
}

const avatarColors = [
  'bg-[#bfdbfe] text-[#1d4f91]',
  'bg-[#fecaca] text-[#7f1d1d]',
  'bg-[#fde68a] text-[#854d0e]',
  'bg-[#d9f99d] text-[#365314]',
  'bg-[#bbf7d0] text-[#166534]',
  'bg-[#fed7aa] text-[#9a3412]',
]

function getInitials(label: string) {
  const initials = label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'NA'
}

function InitialAvatar({ label }: InitialAvatarProps) {
  const colorClass =
    avatarColors[label.charCodeAt(0) % avatarColors.length] ?? avatarColors[0]

  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold',
        colorClass,
      )}
    >
      {getInitials(label)}
    </span>
  )
}

export { InitialAvatar }
