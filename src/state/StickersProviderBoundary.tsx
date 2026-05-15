import type { ReactNode } from 'react'
import { StickersProvider } from './stickersStore'

type StickersProviderBoundaryProps = {
  userId: string
  children: ReactNode
}

export default function StickersProviderBoundary({ userId, children }: StickersProviderBoundaryProps) {
  return <StickersProvider userId={userId}>{children}</StickersProvider>
}
