import { Suspense } from 'react'
import HomeContent from './content'

export default function Home() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <HomeContent />
    </Suspense>
  )
}
