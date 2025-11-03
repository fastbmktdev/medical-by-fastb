import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-zinc-950 p-12 border border-zinc-700 rounded-lg text-center">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <h3 className="mb-2 font-semibold text-lg">{title}</h3>
      {description && <p className="mb-4 text-zinc-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
