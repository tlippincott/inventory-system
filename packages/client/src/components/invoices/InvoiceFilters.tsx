import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { InvoiceFilters } from '@/types';

interface InvoiceFiltersProps {
  filters: InvoiceFilters;
  onChange: (filters: InvoiceFilters) => void;
}

export function InvoiceFiltersComponent({
  filters,
  onChange,
}: InvoiceFiltersProps) {
  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value });
  };

  const handleStatusChange = (status: InvoiceFilters['status'] | 'all') => {
    onChange({
      ...filters,
      status: status === 'all' ? undefined : status,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by invoice number or client name..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 mr-2">Status:</span>
            <Button
              variant={!filters.status ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('all')}
            >
              All
            </Button>
            <Button
              variant={filters.status === 'draft' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('draft')}
            >
              Draft
            </Button>
            <Button
              variant={filters.status === 'sent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('sent')}
            >
              Sent
            </Button>
            <Button
              variant={filters.status === 'paid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('paid')}
            >
              Paid
            </Button>
            <Button
              variant={filters.status === 'overdue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('overdue')}
            >
              Overdue
            </Button>
            <Button
              variant={filters.status === 'cancelled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('cancelled')}
            >
              Cancelled
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
