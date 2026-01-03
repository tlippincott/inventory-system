import { useState } from 'react';
import {
  useProjects,
  useDeleteProject,
  useToggleProjectActive,
  useArchiveProject,
  useUnarchiveProject,
} from '@/hooks/api/useProjects';
import { useClients } from '@/hooks/api/useClients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Plus, Search, Edit, Trash2, MoreVertical, Archive } from 'lucide-react';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/utils/currency';
import type { Project } from '@invoice-system/shared';

export function Projects() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  type ProjectViewMode = 'active' | 'all' | 'archived';
  const [viewMode, setViewMode] = useState<ProjectViewMode>('active');

  const debouncedSearch = useDebounce(search, 300);

  // Build query params based on view mode
  const queryParams = (() => {
    const base = { search: debouncedSearch || undefined };

    switch (viewMode) {
      case 'active':
        return { ...base, isActive: true }; // Backend defaults isArchived to false
      case 'all':
        return { ...base }; // Backend defaults isArchived to false, isActive undefined = all
      case 'archived':
        return { ...base, isArchived: true }; // Show only archived
      default:
        return base;
    }
  })();

  const { data: projects, isLoading } = useProjects(queryParams);

  const { data: clients } = useClients({ isActive: true });

  const deleteMutation = useDeleteProject();
  const toggleActiveMutation = useToggleProjectActive();
  const archiveMutation = useArchiveProject();
  const unarchiveMutation = useUnarchiveProject();

  const handleCreate = () => {
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleDelete = async (project: Project) => {
    if (
      !confirm(
        `Are you sure you want to delete ${project.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(project.id);
      toast({
        title: 'Project Deleted',
        description: `${project.name} has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (project: Project) => {
    try {
      await toggleActiveMutation.mutateAsync(project.id);
      toast({
        title: project.isActive ? 'Project Deactivated' : 'Project Activated',
        description: `${project.name} has been ${project.isActive ? 'deactivated' : 'activated'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to update project status',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (project: Project) => {
    try {
      await archiveMutation.mutateAsync(project.id);
      toast({
        title: 'Project Archived',
        description: `${project.name} has been archived.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to archive project',
        variant: 'destructive',
      });
    }
  };

  const handleUnarchive = async (project: Project) => {
    try {
      await unarchiveMutation.mutateAsync(project.id);
      toast({
        title: 'Project Unarchived',
        description: `${project.name} has been unarchived.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to unarchive project',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search projects by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {viewMode !== 'all' && (
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => setViewMode('all')}
              >
                Show All
              </Button>
            )}
            {viewMode !== 'active' && (
              <Button
                variant={viewMode === 'active' ? 'default' : 'outline'}
                onClick={() => setViewMode('active')}
              >
                Show Active Only
              </Button>
            )}
            {viewMode !== 'archived' && (
              <Button
                variant={viewMode === 'archived' ? 'default' : 'outline'}
                onClick={() => setViewMode('archived')}
              >
                Show Archived
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {projects?.length || 0} Project
            {projects?.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !projects || projects.length === 0 ? (
            <Alert>
              <AlertDescription>
                {search
                  ? 'No projects found matching your search.'
                  : 'No projects yet. Create your first project to get started!'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      {!project.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {project.isArchived && (
                        <Badge variant="outline">Archived</Badge>
                      )}
                    </div>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-600">
                        Client: {project.client?.name || 'Unknown'}
                      </p>
                      {project.description && (
                        <p className="text-sm text-gray-600">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="text-sm">
                          <span className="text-gray-500">Hourly Rate: </span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(project.defaultHourlyRateCents || 0)}/hr
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(project)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {!project.isArchived && (
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(project)}
                        >
                          {project.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                      )}
                      {project.isArchived ? (
                        <DropdownMenuItem
                          onClick={() => handleUnarchive(project)}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Unarchive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleArchive(project)}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(project)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Dialog */}
      <ProjectDialog
        project={editingProject}
        clients={clients || []}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingProject(null);
          }
        }}
      />
    </div>
  );
}
