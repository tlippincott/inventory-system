import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/api/useUserSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import type { UpdateUserSettingsDTO } from '@invoice-system/shared';

export function Settings() {
  const { toast } = useToast();
  const { data: settings, isLoading, error } = useUserSettings();
  const updateMutation = useUpdateUserSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserSettingsDTO>();

  // Reset form when settings are loaded
  useEffect(() => {
    if (settings) {
      reset({
        businessName: settings.businessName,
        ownerName: settings.ownerName || '',
        email: settings.email || '',
        phone: settings.phone || '',
        addressLine1: settings.addressLine1 || '',
        addressLine2: settings.addressLine2 || '',
        city: settings.city || '',
        state: settings.state || '',
        postalCode: settings.postalCode || '',
        country: settings.country || '',
        taxId: settings.taxId || '',
        defaultPaymentTerms: settings.defaultPaymentTerms,
        defaultCurrency: settings.defaultCurrency,
        defaultTaxRate: settings.defaultTaxRate,
        invoicePrefix: settings.invoicePrefix,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: UpdateUserSettingsDTO) => {
    try {
      // Convert empty string to undefined for optional number fields
      const sanitizedData = {
        ...data,
        defaultPaymentTerms: data.defaultPaymentTerms || undefined,
        defaultTaxRate: data.defaultTaxRate || undefined,
      };

      await updateMutation.mutateAsync(sanitizedData);
      toast({
        title: 'Settings Updated',
        description: 'Your business settings have been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update settings',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load settings. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              This information will appear on your invoices and documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  {...register('businessName', {
                    required: 'Business name is required',
                    minLength: { value: 1, message: 'Business name is required' },
                  })}
                  placeholder="TAMMY SUE ALLEN"
                />
                {errors.businessName && (
                  <p className="text-sm text-red-500">{errors.businessName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  {...register('ownerName')}
                  placeholder="Tammy Allen"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  placeholder="contact@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / Business Number</Label>
              <Input
                id="taxId"
                {...register('taxId')}
                placeholder="XX-XXXXXXX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Address */}
        <Card>
          <CardHeader>
            <CardTitle>Business Address</CardTitle>
            <CardDescription>
              Your business address for invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                {...register('addressLine1')}
                placeholder="123 Main Street"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                {...register('addressLine2')}
                placeholder="Suite 100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="San Francisco"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State / Province</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="CA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  {...register('postalCode')}
                  placeholder="94105"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="United States"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Defaults</CardTitle>
            <CardDescription>
              Default values for new invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  {...register('invoicePrefix')}
                  placeholder="INV-"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Input
                  id="defaultCurrency"
                  {...register('defaultCurrency', {
                    minLength: { value: 3, message: 'Currency must be 3 characters' },
                    maxLength: { value: 3, message: 'Currency must be 3 characters' },
                  })}
                  placeholder="USD"
                  maxLength={3}
                />
                {errors.defaultCurrency && (
                  <p className="text-sm text-red-500">{errors.defaultCurrency.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultPaymentTerms">Default Payment Terms (days)</Label>
                <Input
                  id="defaultPaymentTerms"
                  type="number"
                  {...register('defaultPaymentTerms', {
                    setValueAs: (v) => v === '' || v === null ? undefined : Number(v),
                    validate: (v) => {
                      if (v === undefined || v === null || v === '') return true;
                      const num = Number(v);
                      if (num < 0) return 'Must be 0 or greater';
                      if (num > 365) return 'Must be 365 or less';
                      return true;
                    },
                  })}
                  placeholder="30 (optional)"
                />
                {errors.defaultPaymentTerms && (
                  <p className="text-sm text-red-500">{errors.defaultPaymentTerms.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  step="0.01"
                  {...register('defaultTaxRate', {
                    setValueAs: (v) => v === '' || v === null ? undefined : Number(v),
                    validate: (v) => {
                      if (v === undefined || v === null || v === '') return true;
                      const num = Number(v);
                      if (num < 0) return 'Must be 0 or greater';
                      if (num > 100) return 'Must be 100 or less';
                      return true;
                    },
                  })}
                  placeholder="8.5 (optional)"
                />
                {errors.defaultTaxRate && (
                  <p className="text-sm text-red-500">{errors.defaultTaxRate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
