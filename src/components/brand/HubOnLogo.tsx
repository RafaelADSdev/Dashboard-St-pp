import Image from 'next/image'
import clsx from 'clsx'

interface HubOnLogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function HubOnLogo({
  width = 110,
  height = 41,
  className = 'h-8 w-auto max-h-8 opacity-90',
  priority = false,
}: HubOnLogoProps) {
  return (
    <Image
      src="/hubon-logo.png"
      alt="HubON"
      width={width}
      height={height}
      priority={priority}
      className={clsx(className, 'dark:brightness-0 dark:invert')}
    />
  )
}
