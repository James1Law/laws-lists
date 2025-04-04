import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8">Could not find requested resource</p>
      <Button asChild>
        <Link href="/" className="bg-blue-500 hover:bg-blue-600 text-white">
          Return Home
        </Link>
      </Button>
    </div>
  );
} 