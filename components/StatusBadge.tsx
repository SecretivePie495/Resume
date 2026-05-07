import { ApplicationStatus } from '@/lib/db';

const CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  generated:    { label: 'Generated',    className: 'bg-slate-100 text-slate-600' },
  not_applied:  { label: 'Not Applied',  className: 'bg-slate-100 text-slate-500' },
  applied:      { label: 'Applied',      className: 'bg-blue-100 text-blue-700' },
  interviewing: { label: 'Interviewing', className: 'bg-amber-100 text-amber-700' },
  offer:        { label: 'Offer',        className: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',     className: 'bg-red-100 text-red-600' },
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.generated;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
      {label}
    </span>
  );
}
