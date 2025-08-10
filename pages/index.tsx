import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');  // Use replace instead of push
  }, []);

  return <div>Loading...</div>;
}