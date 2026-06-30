import Image from 'next/image'
import clsx from 'clsx'

interface HubOnLogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function HubOnLogo({
  width = 90,
  height = 30,
  className = 'h-7 w-auto opacity-90',
  priority = false,
}: HubOnLogoProps) {
  return (
    <>
      <Image
        src="/hubon-logo.jpeg"
        alt="HubON"
        width={width}
        height={height}
        priority={priority}
        className={clsx(className, 'dark:hidden')}
      />
      <Image
        src="/hubon-logo-white.jpeg"
        alt="HubON"
        width={width}
        height={height}
        priority={priority}
        className={clsx(className, 'hidden dark:block')}
      />
    </>
  )
}
