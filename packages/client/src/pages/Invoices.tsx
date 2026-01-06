import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useInvoices,
  useDeleteInvoice,
  useUpdateInvoiceStatus,
  useGeneratePDF,
} from '@/hooks/api/useInvoices';
import { API_BASE_URL } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Plus, MoreVertical, Download, Eye } from 'lucide-react';
import { InvoiceFiltersComponent } from '@/components/invoices/InvoiceFilters';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { Invoice, InvoiceStatus } from '@invoice-system/shared';
import type { InvoiceFilters } from '@/types';

export function Invoices() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InvoiceFilters>({});

  const debouncedFilters = useDebounce(filters, 300);

  const { data: invoices, isLoading } = useInvoices(debouncedFilters);

  const deleteMutation = useDeleteInvoice();
  const updateStatusMutation = useUpdateInvoiceStatus();
  const generatePDFMutation = useGeneratePDF();

  const handleViewDetail = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };

  const handleDelete = async (invoice: Invoice) => {
    // Prevent deleting paid or cancelled invoices
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      toast({
        title: 'Cannot Delete',
        description: `Cannot delete ${invoice.status} invoices.`,
        variant: 'destructive',
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(invoice.id);
      toast({
        title: 'Invoice Deleted',
        description: `Invoice ${invoice.invoiceNumber} has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: InvoiceStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: invoice.id,
        status: newStatus,
      });
      toast({
        title: 'Status Updated',
        description: `Invoice ${invoice.invoiceNumber} marked as ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to update invoice status',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      toast({
        title: 'Opening PDF...',
        duration: 2000,
      });

      // If PDF doesn't exist, generate it first
      if (!invoice.pdfPath) {
        await generatePDFMutation.mutateAsync(invoice.id);
      }

      // Open PDF in new tab
      const pdfUrl = `${API_BASE_URL}/invoices/${invoice.id}/pdf`;
      window.open(pdfUrl, '_blank');

      toast({
        title: 'PDF Opened',
        description: `${invoice.invoiceNumber}.pdf opened in new tab.`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Open PDF',
        description:
          error.response?.data?.message ||
          'Could not open PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getAvailableStatusActions = (currentStatus: InvoiceStatus) => {
    switch (currentStatus) {
      case 'draft':
        return [
          { label: 'Mark as Sent', value: 'sent' as InvoiceStatus },
          { label: 'Cancel Invoice', value: 'cancelled' as InvoiceStatus },
        ];
      case 'sent':
        return [
          { label: 'Mark as Paid', value: 'paid' as InvoiceStatus },
          { label: 'Mark as Overdue', value: 'overdue' as InvoiceStatus },
          { label: 'Cancel Invoice', value: 'cancelled' as InvoiceStatus },
        ];
      case 'overdue':
        return [
          { label: 'Mark as Paid', value: 'paid' as InvoiceStatus },
          { label: 'Cancel Invoice', value: 'cancelled' as InvoiceStatus },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/invoices/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Manual Invoice
          </Button>
          <Button onClick={() => navigate('/invoices/from-sessions')}>
            <Plus className="h-4 w-4 mr-2" />
            Create from Time
          </Button>
        </div>
      </div>

      {/* Filters */}
      <InvoiceFiltersComponent filters={filters} onChange={setFilters} />

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {invoices?.length || 0} Invoice
            {invoices?.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <Alert>
              <AlertDescription>
                {filters.search || filters.status
                  ? 'No invoices found matching your search.'
                  : 'No invoices yet. Create your first invoice to get started!'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => handleViewDetail(invoice)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </h3>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-600">
                        {invoice.client?.name || 'Unknown Client'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Issued: {formatDate(new Date(invoice.issueDate))}</span>
                        <span>Due: {formatDate(new Date(invoice.dueDate))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(invoice.totalCents)}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(invoice);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(invoice);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View PDF
                        </DropdownMenuItem>

                        {getAvailableStatusActions(invoice.status).length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Change Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {getAvailableStatusActions(invoice.status).map(
                                  (action) => (
                                    <DropdownMenuItem
                                      key={action.value}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(invoice, action.value);
                                      }}
                                    >
                                      {action.label}
                                    </DropdownMenuItem>
                                  )
                                )}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </>
                        )}

                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(invoice);
                              }}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
