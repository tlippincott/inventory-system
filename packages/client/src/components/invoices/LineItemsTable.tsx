import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/currency';
import type { InvoiceItem } from '@invoice-system/shared';

interface LineItemsTableProps {
  items: InvoiceItem[];
  subtotalCents: number;
  taxRate: number;
  taxAmountCents: number;
  totalCents: number;
  readOnly?: boolean;
}

export function LineItemsTable({
  items,
  subtotalCents,
  taxRate,
  taxAmountCents,
  totalCents,
  readOnly = true,
}: LineItemsTableProps) {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.description}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.unitPriceCents)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.totalCents)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Totals Section */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax ({taxRate}%):</span>
            <span className="font-medium">{formatCurrency(taxAmountCents)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t text-lg font-bold">
            <span>Total:</span>
            <span>{formatCurrency(totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
