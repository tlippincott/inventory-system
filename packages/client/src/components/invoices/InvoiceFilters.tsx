import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
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

  const handleDateChange = (field: 'fromDate' | 'toDate', value: string) => {
    onChange({ ...filters, [field]: value || undefined });
  };

  const handleDateTypeChange = (value: 'issue_date' | 'due_date') => {
    onChange({ ...filters, dateType: value });
  };

  const handleClearDateRange = () => {
    onChange({
      ...filters,
      fromDate: undefined,
      toDate: undefined,
      dateType: undefined,
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

          {/* Date Range Filter */}
          <div className="border-t pt-4">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="date-type" className="text-sm text-gray-600 mb-2 block">
                  Filter By
                </Label>
                <Select
                  value={filters.dateType || 'issue_date'}
                  onValueChange={handleDateTypeChange}
                >
                  <SelectTrigger id="date-type">
                    <SelectValue placeholder="Select date type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="issue_date">Issued Date</SelectItem>
                    <SelectItem value="due_date">Due Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="from-date" className="text-sm text-gray-600 mb-2 block">
                  Begin Date
                </Label>
                <Input
                  id="from-date"
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => handleDateChange('fromDate', e.target.value)}
                  placeholder="mm/dd/yyyy"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="to-date" className="text-sm text-gray-600 mb-2 block">
                  End Date
                </Label>
                <Input
                  id="to-date"
                  type="date"
                  value={filters.toDate || ''}
                  onChange={(e) => handleDateChange('toDate', e.target.value)}
                  placeholder="mm/dd/yyyy"
                />
              </div>

              {(filters.fromDate || filters.toDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearDateRange}
                  className="mb-0"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Dates
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
