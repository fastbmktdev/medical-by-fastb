import { Suspense } from 'react';
import GymsClientPage from "./GymsClientPage";
import CenteredLoading from '@/components/layout/CenteredLoading';

export default async function GymsPage() {
  return (
    <Suspense fallback={<CenteredLoading />}>
      <GymsClientPage />
    </Suspense>
  );
}
