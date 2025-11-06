import { ReactNode } from "react";
import { Link } from "@/navigation";

export interface AdminInfoSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Reusable section component for admin detail views
 * Provides consistent styling for information sections
 */
export default function AdminInfoSection({
  title,
  children,
  className = "",
}: AdminInfoSectionProps) {
  return (
    <div className={className}>
      <h4 className="mb-3 font-semibold text-white">{title}</h4>
      {children}
    </div>
  );
}

export interface AdminInfoItemProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  isLink?: boolean;
  href?: string;
}

/**
 * Individual info item component for consistent display
 */
export function AdminInfoItem({
  icon,
  label,
  value,
  isLink = false,
  href,
}: AdminInfoItemProps) {
  const content =
    isLink && href ? (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {value}
      </Link>
    ) : (
      <span className="text-white">{value}</span>
    );

  return (
    <div className="flex items-center gap-3">
      <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
        {icon}
      </div>
      <div>
        <p className="text-default-400 text-xs">{label}</p>
        {content}
      </div>
    </div>
  );
}

export interface AdminInfoItemStartProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
}

/**
 * Info item with start alignment for longer content
 */
export function AdminInfoItemStart({
  icon,
  label,
  value,
  className = "",
}: AdminInfoItemStartProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-default-400 text-xs">{label}</p>
        <div className="text-white">{value}</div>
      </div>
    </div>
  );
}
