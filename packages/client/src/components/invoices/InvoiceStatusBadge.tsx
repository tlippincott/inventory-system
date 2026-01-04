import { Badge } from '@/components/ui/badge';
import type { InvoiceStatus } from '@invoice-system/shared';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case 'draft':
        return 'secondary'; // gray
      case 'sent':
        return 'default'; // blue
      case 'paid':
        return 'default'; // Will use custom class for green
      case 'overdue':
        return 'destructive'; // red
      case 'cancelled':
        return 'outline'; // gray outline
      default:
        return 'secondary';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'sent':
        return 'Sent';
      case 'paid':
        return 'Paid';
      case 'overdue':
        return 'Overdue';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getCustomClass = () => {
    if (status === 'paid') {
      return 'bg-green-600 hover:bg-green-700 text-white';
    }
    return '';
  };

  return (
    <Badge
      variant={getVariant()}
      className={`${getCustomClass()} ${className || ''}`}
    >
      {getLabel()}
    </Badge>
  );
}
