import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PronunciationLab from '@/components/PronunciationLab'

export default async function PhoneticsPage() {
  const token = (await cookies()).get('token')?.value
  if (!token) redirect('/login')

  return <PronunciationLab />
}
