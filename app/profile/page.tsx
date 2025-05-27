import { redirect } from 'next/navigation'

export default function ProfilePage() {
  // Server-side redirect to home page
  redirect('/')
}
