import { redirect } from 'next/navigation';

export default function AccessRedirectPage() {
  redirect('/admin/audit');
}
