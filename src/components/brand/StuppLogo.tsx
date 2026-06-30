import Image from 'next/image'
import clsx from 'clsx'

interface StuppLogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function StuppLogo({
  width = 140,
  height = 40,
  className = 'h-9 w-auto',
  priority = false,
}: StuppLogoProps) {
  return (
    <>
      <Image
        src="/stupp-logo.png"
        alt="Superintendência Stüpp"
        width={width}
        height={height}
        priority={priority}
        className={clsx(className, 'dark:hidden')}
      />
      <Image
        src="/stupp-logo-white.png"
        alt="Superintendência Stüpp"
        width={width}
        height={height}
        priority={priority}
        className={clsx(className, 'hidden dark:block')}
      />
    </>
  )
}
