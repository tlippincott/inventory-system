import { useParams, useNavigate } from 'react-router-dom';
import {
  useInvoice,
  useUpdateInvoiceStatus,
  useGeneratePDF,
  useDeleteInvoice,
} from '@/hooks/api/useInvoices';
import { API_BASE_URL } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download } from 'lucide-react';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { LineItemsTable } from '@/components/invoices/LineItemsTable';
import { formatDate } from '@/utils/date';
import type { InvoiceStatus } from '@invoice-system/shared';

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: invoice, isLoading } = useInvoice(id!);
  const updateStatusMutation = useUpdateInvoiceStatus();
  const generatePDFMutation = useGeneratePDF();
  const deleteMutation = useDeleteInvoice();

  const handleDownloadPDF = async () => {
    if (!invoice || !id) return;

    try {
      toast({
        title: 'Opening PDF...',
        duration: 2000,
      });

      // If PDF doesn't exist, generate it first
      if (!invoice.pdfPath) {
        await generatePDFMutation.mutateAsync(id);
      }

      // Open PDF in new tab
      const pdfUrl = `${API_BASE_URL}/invoices/${id}/pdf`;
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

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    if (!id) return;

    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: newStatus,
      });
      toast({
        title: 'Status Updated',
        description: `Invoice marked as ${newStatus}.`,
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

  const handleDelete = async () => {
    if (!invoice || !id) return;

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
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Invoice Deleted',
        description: `Invoice ${invoice.invoiceNumber} has been deleted.`,
      });
      navigate('/invoices');
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            Invoice not found or has been deleted.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  const canChangeStatus = invoice.status !== 'paid' && invoice.status !== 'cancelled';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {invoice.invoiceNumber}
          </h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            View PDF
          </Button>
          {canChangeStatus && invoice.status === 'draft' && (
            <Button onClick={() => handleStatusChange('sent')}>
              Mark as Sent
            </Button>
          )}
          {canChangeStatus && invoice.status === 'sent' && (
            <Button onClick={() => handleStatusChange('paid')}>
              Mark as Paid
            </Button>
          )}
          {canChangeStatus && invoice.status === 'overdue' && (
            <Button onClick={() => handleStatusChange('paid')}>
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Client
              </label>
              <p className="mt-1 text-gray-900 font-medium">
                {invoice.client?.name || 'Unknown Client'}
              </p>
              {invoice.client?.email && (
                <p className="mt-1 text-sm text-gray-600">
                  {invoice.client.email}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Issue Date
              </label>
              <p className="mt-1 text-gray-900">
                {formatDate(new Date(invoice.issueDate))}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Due Date
              </label>
              <p className="mt-1 text-gray-900">
                {formatDate(new Date(invoice.dueDate))}
              </p>
            </div>
            {invoice.servicePeriodEndDate && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">
                  Work Period
                </label>
                <p className="mt-1 text-gray-900">
                  For design work done through {formatDate(new Date(invoice.servicePeriodEndDate))}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <div className="mt-1">
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Currency
              </label>
              <p className="mt-1 text-gray-900">{invoice.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Card */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.items && invoice.items.length > 0 ? (
            <LineItemsTable
              items={invoice.items}
              subtotalCents={invoice.subtotalCents}
              taxRate={invoice.taxRate}
              taxAmountCents={invoice.taxAmountCents}
              totalCents={invoice.totalCents}
              readOnly
            />
          ) : (
            <Alert>
              <AlertDescription>No line items in this invoice.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Notes/Terms Card */}
      {(invoice.notes || invoice.terms) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Notes
                </label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Payment Terms
                </label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                  {invoice.terms}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      {canChangeStatus && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Delete this invoice</p>
                <p className="text-sm text-gray-600 mt-1">
                  Once deleted, the invoice and its line items will be permanently removed.
                  Any time sessions linked to this invoice will be unbilled.
                </p>
              </div>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
