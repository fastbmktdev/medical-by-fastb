import { ReactNode, memo } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

function EmptyStateComponent({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-white text-zinc-950 p-12 border border-gray-300  text-center">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <h3 className="mb-2 font-semibold text-lg">{title}</h3>
      {description && <p className="mb-4 text-gray-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

const EmptyState = memo(EmptyStateComponent);
export default EmptyState;
