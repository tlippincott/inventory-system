import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useClients } from '@/hooks/api/useClients';
import { useUserSettings } from '@/hooks/api/useUserSettings';
import { useCreateInvoice } from '@/hooks/api/useInvoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { formatInputDate } from '@/utils/date';
import { parseDollars, centsToInput, formatCurrency } from '@/utils/currency';

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  taxRate: z.coerce.number().min(0).max(100),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Description is required'),
        quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
        unitPriceDollars: z.string().min(1, 'Price is required'),
      })
    )
    .min(1, 'At least one line item is required'),
});

type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

export function CreateInvoice() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: clients } = useClients({ isActive: true });
  const { data: userSettings } = useUserSettings();
  const createMutation = useCreateInvoice();

  const form = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      clientId: '',
      issueDate: formatInputDate(new Date()),
      dueDate: '',
      taxRate: 0,
      currency: 'USD',
      notes: '',
      terms: '',
      items: [{ description: '', quantity: 1, unitPriceDollars: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Set default tax rate from user settings
  useEffect(() => {
    if (userSettings) {
      form.setValue('taxRate', userSettings.defaultTaxRate);
    }
  }, [userSettings, form]);

  // Calculate totals
  const items = form.watch('items');
  const taxRate = form.watch('taxRate') || 0;

  const calculateTotals = () => {
    let subtotalCents = 0;

    items.forEach((item) => {
      const quantity = item.quantity || 0;
      const unitPriceCents = item.unitPriceDollars
        ? parseDollars(item.unitPriceDollars)
        : 0;
      subtotalCents += quantity * unitPriceCents;
    });

    const taxAmountCents = Math.round(subtotalCents * (taxRate / 100));
    const totalCents = subtotalCents + taxAmountCents;

    return { subtotalCents, taxAmountCents, totalCents };
  };

  const { subtotalCents, taxAmountCents, totalCents } = calculateTotals();

  const onSubmit = async (data: CreateInvoiceFormData) => {
    try {
      // Convert form data to API format
      const invoiceData = {
        clientId: data.clientId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        taxRate: data.taxRate,
        currency: data.currency,
        notes: data.notes || undefined,
        terms: data.terms || undefined,
        items: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: parseDollars(item.unitPriceDollars),
        })),
      };

      const result = await createMutation.mutateAsync(invoiceData);
      toast({
        title: 'Invoice Created',
        description: `Invoice ${result.data.invoiceNumber} has been created successfully.`,
      });
      navigate(`/invoices/${result.data.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to create invoice',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Create Manual Invoice
        </h1>
        <Button variant="outline" onClick={() => navigate('/invoices')}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Invoice Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ description: '', quantity: 1, unitPriceDollars: '' })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Service or item" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="1"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPriceDollars`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="mt-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Totals Display */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(subtotalCents)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({taxRate}%):</span>
                      <span className="font-medium">
                        {formatCurrency(taxAmountCents)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(totalCents)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes for this invoice..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Payment terms and conditions..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/invoices')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
