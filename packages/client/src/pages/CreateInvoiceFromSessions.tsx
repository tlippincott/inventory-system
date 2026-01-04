import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/api/useClients';
import { useProjects } from '@/hooks/api/useProjects';
import { useUnbilledSessions } from '@/hooks/api/useTimeSessions';
import { useUserSettings } from '@/hooks/api/useUserSettings';
import { useCreateInvoiceFromSessions } from '@/hooks/api/useInvoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { formatInputDate } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import type { Project, TimeSession } from '@invoice-system/shared';

export function CreateInvoiceFromSessions() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step state
  const [step, setStep] = useState(1);

  // Step 1: Client selection
  const [selectedClientId, setSelectedClientId] = useState('');

  // Step 2: Project selection
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Step 3: Session selection
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

  // Step 4: Invoice details
  const [invoiceDetails, setInvoiceDetails] = useState({
    issueDate: formatInputDate(new Date()),
    dueDate: '',
    taxRate: 0,
    notes: '',
    terms: '',
  });

  // Queries
  const { data: clients } = useClients({ isActive: true });
  const { data: projects } = useProjects(
    { clientId: selectedClientId, isActive: true },
    { enabled: !!selectedClientId }
  );
  const { data: userSettings } = useUserSettings();

  // Get unbilled sessions for selected projects
  const { data: allUnbilledSessions } = useUnbilledSessions(
    { clientId: selectedClientId },
    { enabled: !!selectedClientId }
  );

  // Filter sessions by selected projects
  const unbilledSessions = useMemo(() => {
    if (!allUnbilledSessions || selectedProjectIds.length === 0) {
      return [];
    }
    return allUnbilledSessions.filter((session) =>
      selectedProjectIds.includes(session.projectId)
    );
  }, [allUnbilledSessions, selectedProjectIds]);

  // Set default tax rate from user settings
  useEffect(() => {
    if (userSettings) {
      setInvoiceDetails((prev) => ({
        ...prev,
        taxRate: userSettings.defaultTaxRate,
      }));
    }
  }, [userSettings]);

  // Auto-select all sessions when they load
  useEffect(() => {
    if (unbilledSessions && unbilledSessions.length > 0 && step === 3) {
      // Only auto-select if nothing is selected yet
      if (selectedSessionIds.length === 0) {
        setSelectedSessionIds(unbilledSessions.map((s) => s.id));
      }
    }
  }, [unbilledSessions, step, selectedSessionIds.length]);

  // Mutation
  const createMutation = useCreateInvoiceFromSessions();

  // Calculate totals for selected sessions
  const selectedSessions = useMemo(() => {
    return unbilledSessions.filter((s) => selectedSessionIds.includes(s.id));
  }, [unbilledSessions, selectedSessionIds]);

  const subtotalCents = useMemo(() => {
    return selectedSessions.reduce(
      (sum, s) => sum + (s.billableAmountCents || 0),
      0
    );
  }, [selectedSessions]);

  const taxAmountCents = Math.round(
    subtotalCents * (invoiceDetails.taxRate / 100)
  );
  const totalCents = subtotalCents + taxAmountCents;

  const totalHours = useMemo(() => {
    return selectedSessions.reduce(
      (sum, s) => sum + (s.durationSeconds || 0) / 3600,
      0
    );
  }, [selectedSessions]);

  // Group sessions by project for preview
  const lineItemsPreview = useMemo(() => {
    const projectGroups = new Map<
      string,
      { project: Project; sessions: TimeSession[]; totalCents: number; hours: number }
    >();

    selectedSessions.forEach((session) => {
      const project = projects?.find((p) => p.id === session.projectId);
      if (!project) return;

      if (!projectGroups.has(session.projectId)) {
        projectGroups.set(session.projectId, {
          project,
          sessions: [],
          totalCents: 0,
          hours: 0,
        });
      }

      const group = projectGroups.get(session.projectId)!;
      group.sessions.push(session);
      group.totalCents += session.billableAmountCents || 0;
      group.hours += (session.durationSeconds || 0) / 3600;
    });

    return Array.from(projectGroups.values());
  }, [selectedSessions, projects]);

  // Validation functions
  const canProceedFromStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!selectedClientId;
      case 2:
        return selectedProjectIds.length > 0;
      case 3:
        return selectedSessionIds.length > 0;
      case 4:
        return !!(invoiceDetails.issueDate && invoiceDetails.dueDate);
      default:
        return true;
    }
  };

  // Handlers
  const handleNext = () => {
    if (canProceedFromStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      const result = await createMutation.mutateAsync({
        sessionIds: selectedSessionIds,
        clientId: selectedClientId,
        groupByProject: true, // ⭐ Group sessions by project
        issueDate: invoiceDetails.issueDate,
        dueDate: invoiceDetails.dueDate,
        taxRate: invoiceDetails.taxRate,
        notes: invoiceDetails.notes || undefined,
        terms: invoiceDetails.terms || undefined,
      });

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

  // Toggle project selection
  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  // Toggle session selection
  const toggleSession = (sessionId: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Create Invoice from Time Sessions
        </h1>
        <Button variant="outline" onClick={() => navigate('/invoices')}>
          Cancel
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        <Badge variant={step >= 1 ? 'default' : 'outline'}>1. Client</Badge>
        <Badge variant={step >= 2 ? 'default' : 'outline'}>2. Projects</Badge>
        <Badge variant={step >= 3 ? 'default' : 'outline'}>3. Sessions</Badge>
        <Badge variant={step >= 4 ? 'default' : 'outline'}>4. Details</Badge>
        <Badge variant={step >= 5 ? 'default' : 'outline'}>5. Confirm</Badge>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Client Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Select Client</h2>
              <div className="max-w-md">
                <Label>Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Project Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Select Projects</h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedProjectIds(projects?.map((p) => p.id) || [])
                    }
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProjectIds([])}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {projects && projects.length > 0 ? (
                <div className="space-y-2">
                  {projects.map((project) => {
                    const projectSessions = allUnbilledSessions?.filter(
                      (s) => s.projectId === project.id
                    ) || [];
                    const totalHours =
                      projectSessions.reduce(
                        (sum, s) => sum + (s.durationSeconds || 0),
                        0
                      ) / 3600;
                    const totalAmount = projectSessions.reduce(
                      (sum, s) => sum + (s.billableAmountCents || 0),
                      0
                    );

                    return (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleProject(project.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedProjectIds.includes(project.id)}
                            onCheckedChange={() => toggleProject(project.id)}
                          />
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-gray-600">
                              {totalHours.toFixed(2)} hours unbilled
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(totalAmount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No active projects found for this client.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 3: Session Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Review & Edit Sessions</h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedSessionIds(unbilledSessions.map((s) => s.id))
                    }
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSessionIds([])}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                All unbilled sessions for selected projects are checked by default.
                You can deselect any you don't want to include.
              </p>

              {unbilledSessions.length > 0 ? (
                <div className="space-y-2">
                  {unbilledSessions.map((session) => {
                    const project = projects?.find((p) => p.id === session.projectId);
                    const hours = (session.durationSeconds || 0) / 3600;

                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleSession(session.id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={selectedSessionIds.includes(session.id)}
                            onCheckedChange={() => toggleSession(session.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {project?.name || 'Unknown Project'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {session.description || 'No description'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {hours.toFixed(2)} hrs
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(session.billableAmountCents || 0)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No unbilled sessions found for the selected projects.
                  </AlertDescription>
                </Alert>
              )}

              {/* Selected totals */}
              {selectedSessionIds.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Selected: {selectedSessionIds.length} sessions</span>
                    <span className="font-medium">
                      {totalHours.toFixed(2)} hours ={' '}
                      {formatCurrency(subtotalCents)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Invoice Details */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Invoice Details</h2>

              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <Label>Issue Date</Label>
                  <Input
                    type="date"
                    value={invoiceDetails.issueDate}
                    onChange={(e) =>
                      setInvoiceDetails({ ...invoiceDetails, issueDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={invoiceDetails.dueDate}
                    onChange={(e) =>
                      setInvoiceDetails({ ...invoiceDetails, dueDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={invoiceDetails.taxRate}
                    onChange={(e) =>
                      setInvoiceDetails({
                        ...invoiceDetails,
                        taxRate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default from your settings
                  </p>
                </div>
              </div>

              <div className="max-w-2xl">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes for this invoice..."
                  rows={3}
                  value={invoiceDetails.notes}
                  onChange={(e) =>
                    setInvoiceDetails({ ...invoiceDetails, notes: e.target.value })
                  }
                />
              </div>

              <div className="max-w-2xl">
                <Label>Payment Terms (Optional)</Label>
                <Textarea
                  placeholder="Payment terms and conditions..."
                  rows={3}
                  value={invoiceDetails.terms}
                  onChange={(e) =>
                    setInvoiceDetails({ ...invoiceDetails, terms: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Step 5: Confirm & Create */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Review & Confirm</h2>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <Label className="text-gray-500">Client</Label>
                  <p className="font-medium">
                    {clients?.find((c) => c.id === selectedClientId)?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Projects</Label>
                  <p className="font-medium">{selectedProjectIds.length} selected</p>
                </div>
                <div>
                  <Label className="text-gray-500">Sessions</Label>
                  <p className="font-medium">
                    {selectedSessionIds.length} sessions ({totalHours.toFixed(2)}{' '}
                    hours)
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Issue / Due Date</Label>
                  <p className="font-medium">
                    {invoiceDetails.issueDate} / {invoiceDetails.dueDate}
                  </p>
                </div>
              </div>

              {/* Line Items Preview (Grouped by Project) */}
              <div>
                <h3 className="font-semibold mb-3">
                  Line Items (Grouped by Project)
                </h3>
                <div className="border rounded-lg divide-y">
                  {lineItemsPreview.map((item) => (
                    <div
                      key={item.project.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{item.project.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.sessions.length} sessions - {item.hours.toFixed(2)}{' '}
                          hours
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(item.totalCents)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="max-w-md ml-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Tax ({invoiceDetails.taxRate}%):
                  </span>
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
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={step === 1}
        >
          Previous
        </Button>
        {step < 5 ? (
          <Button onClick={handleNext} disabled={!canProceedFromStep(step)}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
          </Button>
        )}
      </div>
    </div>
  );
}
