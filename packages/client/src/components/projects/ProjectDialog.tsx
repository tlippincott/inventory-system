import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCreateProject, useUpdateProject } from '@/hooks/api/useProjects';
import type { Project, Client } from '@invoice-system/shared';

const projectFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientId: z.string().min(1, 'Client is required'),
  description: z.string().optional(),
  defaultHourlyRateCents: z.coerce.number().int().min(0, 'Hourly rate must be positive'),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectDialogProps {
  project: Project | null;
  clients: Client[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDialog({
  project,
  clients,
  open,
  onOpenChange,
}: ProjectDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const [hourlyRateDisplay, setHourlyRateDisplay] = useState('');

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      clientId: '',
      description: '',
      defaultHourlyRateCents: 0,
    },
  });

  useEffect(() => {
    if (project) {
      const rateInDollars = (project.defaultHourlyRateCents || 0) / 100;
      form.reset({
        name: project.name,
        clientId: project.clientId,
        description: project.description || '',
        defaultHourlyRateCents: project.defaultHourlyRateCents || 0,
      });
      setHourlyRateDisplay(rateInDollars > 0 ? `$${rateInDollars.toFixed(2)}` : '');
    } else {
      form.reset({
        name: '',
        clientId: '',
        description: '',
        defaultHourlyRateCents: 0,
      });
      setHourlyRateDisplay('');
    }
  }, [project, form]);

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow user to type freely, including partial values
    setHourlyRateDisplay(value);
  };

  const handleHourlyRateBlur = () => {
    // Remove all non-numeric characters except decimal point
    const numericValue = hourlyRateDisplay.replace(/[^0-9.]/g, '');

    if (numericValue === '') {
      setHourlyRateDisplay('');
      form.setValue('defaultHourlyRateCents', 0);
      return;
    }

    // Parse as float
    const dollars = parseFloat(numericValue);

    if (isNaN(dollars)) {
      setHourlyRateDisplay('');
      form.setValue('defaultHourlyRateCents', 0);
      return;
    }

    // Format as currency and update display
    setHourlyRateDisplay(`$${dollars.toFixed(2)}`);

    // Convert to cents for the form
    const cents = Math.round(dollars * 100);
    form.setValue('defaultHourlyRateCents', cents);
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
      };

      if (project) {
        await updateMutation.mutateAsync({ id: project.id, data: payload });
        toast({
          title: 'Project Updated',
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        await createMutation.mutateAsync(payload);
        toast({
          title: 'Project Created',
          description: `${data.name} has been created successfully.`,
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save project',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Website Redesign" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                          {client.companyName && ` - ${client.companyName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Brief description of the project..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultHourlyRateCents"
              render={() => (
                <FormItem>
                  <FormLabel>Hourly Rate *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="$100.00"
                      value={hourlyRateDisplay}
                      onChange={handleHourlyRateChange}
                      onBlur={handleHourlyRateBlur}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the hourly rate in dollars (e.g., 100 or 100.50)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {project ? 'Update' : 'Create'} Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
