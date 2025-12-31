import { useEffect } from 'react';
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
      form.reset({
        name: project.name,
        clientId: project.clientId,
        description: project.description || '',
        defaultHourlyRateCents: project.defaultHourlyRateCents || 0,
      });
    } else {
      form.reset({
        name: '',
        clientId: '',
        description: '',
        defaultHourlyRateCents: 0,
      });
    }
  }, [project, form]);

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

  const hourlyRateInDollars = form.watch('defaultHourlyRateCents') / 100;

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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate (in cents) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="10000"
                      step="100"
                    />
                  </FormControl>
                  <FormDescription>
                    ${hourlyRateInDollars.toFixed(2)} per hour
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
