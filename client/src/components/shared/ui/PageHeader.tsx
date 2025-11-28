import { memo } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
}

function PageHeaderComponent({ title, description }: PageHeaderProps) {
  return (
    <div className="bg-white text-zinc-950 mt-16 border-gray-300 border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="text-center">
          <h1 className="mb-4 font-semibold text-4xl">{title}</h1>
          <p className="mx-auto max-w-3xl text-zinc-950 text-xl">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export const PageHeader = memo(PageHeaderComponent);