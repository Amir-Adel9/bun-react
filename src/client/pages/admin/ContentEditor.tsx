import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { adminApi, type ContentWithLessons, type Category } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Switch } from "../../components/ui/switch";
import { Separator } from "../../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  Clock,
  MoreVertical,
  GripVertical,
  Eye,
  FileText,
  Settings,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Zod schemas
const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Content is required"),
  estimatedMinutes: z.number().int().min(1).optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

// Loading Skeleton
function EditorSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Lesson Card Component
function LessonCard({
  lesson,
  index,
  onEdit,
  onDelete,
}: {
  lesson: ContentWithLessons["lessons"][0];
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 p-4 border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0 cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </div>
      
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
        {index + 1}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{lesson.title}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{lesson.estimatedMinutes || "?"} min</span>
          <span className="text-xs">•</span>
          <span className="truncate">{lesson.body.slice(0, 50)}...</span>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ContentEditorPage() {
  const navigate = useNavigate();
  const { contentId } = useParams({ from: "/admin/content/$contentId" });

  const [content, setContent] = useState<ContentWithLessons | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Lesson dialog state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<ContentWithLessons["lessons"][0] | null>(null);
  const [lessonSubmitting, setLessonSubmitting] = useState(false);

  const lessonForm = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      body: "",
      estimatedMinutes: 10,
    },
  });

  useEffect(() => {
    loadData();
  }, [contentId]);

  const loadData = async () => {
    try {
      const [contentRes, categoriesRes] = await Promise.all([
        adminApi.getContentById(contentId),
        adminApi.getCategories(),
      ]);
      setContent(contentRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContent = (field: string, value: any) => {
    if (!content) return;
    setContent({ ...content, [field]: value } as ContentWithLessons);
    setHasChanges(true);
  };

  const handleSaveContent = async () => {
    if (!content) return;
    setSaving(true);

    try {
      await adminApi.updateContent(contentId, {
        title: content.title,
        slug: content.slug,
        description: content.description,
        categoryId: content.category.id,
        difficulty: content.difficulty as "beginner" | "intermediate" | "advanced",
        estimatedMinutes: content.estimatedMinutes,
        thumbnailUrl: content.thumbnailUrl || undefined,
        published: content.published,
      });
      toast.success("Content saved successfully");
      setHasChanges(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async (data: LessonFormData) => {
    setLessonSubmitting(true);

    try {
      if (editingLessonId) {
        await adminApi.updateLesson(editingLessonId, data);
        toast.success("Lesson updated successfully");
      } else {
        await adminApi.createLesson(contentId, data);
        toast.success("Lesson created successfully");
      }
      await loadData();
      resetLessonForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save lesson");
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deletingLesson) return;

    try {
      await adminApi.deleteLesson(deletingLesson.id);
      toast.success("Lesson deleted successfully");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete lesson");
    } finally {
      setDeletingLesson(null);
      setDeleteLessonDialogOpen(false);
    }
  };

  const handleEditLesson = (lesson: ContentWithLessons["lessons"][0]) => {
    setEditingLessonId(lesson.id);
    lessonForm.reset({
      title: lesson.title,
      body: lesson.body,
      estimatedMinutes: lesson.estimatedMinutes || 10,
    });
    setLessonDialogOpen(true);
  };

  const resetLessonForm = () => {
    setLessonDialogOpen(false);
    setEditingLessonId(null);
    lessonForm.reset({
      title: "",
      body: "",
      estimatedMinutes: 10,
    });
  };

  if (loading) {
    return <EditorSkeleton />;
  }

  if (!content) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The content you're looking for doesn't exist or has been deleted.
          </p>
          <Button variant="outline" onClick={() => navigate({ to: "/admin/content" })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/content" })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{content.title}</h1>
              <Badge variant={content.published ? "success" : "secondary"}>
                {content.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-muted-foreground">Edit content and manage lessons</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-warning border-warning/50">
              Unsaved changes
            </Badge>
          )}
          <Button onClick={handleSaveContent} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">
            <Settings className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="lessons">
            <BookOpen className="h-4 w-4 mr-2" />
            Lessons
            <Badge variant="secondary" className="ml-2">{content.lessons.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Information</CardTitle>
                  <CardDescription>Basic information about this content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={content.title}
                        onChange={(e) => handleUpdateContent("title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input
                        value={content.slug}
                        onChange={(e) => handleUpdateContent("slug", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={content.description}
                      onChange={(e) => handleUpdateContent("description", e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Thumbnail URL</Label>
                    <Input
                      value={content.thumbnailUrl || ""}
                      onChange={(e) => handleUpdateContent("thumbnailUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={content.category.id}
                      onValueChange={(value) => {
                        const cat = categories.find((c) => c.id === value);
                        if (cat) handleUpdateContent("category", cat);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={content.difficulty}
                      onValueChange={(value) => handleUpdateContent("difficulty", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={content.estimatedMinutes}
                      onChange={(e) =>
                        handleUpdateContent("estimatedMinutes", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Published</Label>
                      <p className="text-sm text-muted-foreground">
                        {content.published ? "Visible to students" : "Hidden from students"}
                      </p>
                    </div>
                    <Switch
                      checked={content.published}
                      onCheckedChange={(checked) => handleUpdateContent("published", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lessons</span>
                    <Badge variant="secondary">{content.lessons.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Duration</span>
                    <span className="text-sm font-medium">
                      {content.lessons.reduce((acc, l) => acc + (l.estimatedMinutes || 0), 0)} min
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lessons</CardTitle>
                <CardDescription>Manage the lessons for this content</CardDescription>
              </div>
              <Button onClick={() => { resetLessonForm(); setLessonDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </CardHeader>
            <CardContent>
              {content.lessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No lessons yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first lesson to get started
                  </p>
                  <Button onClick={() => { resetLessonForm(); setLessonDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {content.lessons.map((lesson, index) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      onEdit={() => handleEditLesson(lesson)}
                      onDelete={() => {
                        setDeletingLesson(lesson);
                        setDeleteLessonDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLessonId ? "Edit Lesson" : "New Lesson"}</DialogTitle>
            <DialogDescription>
              {editingLessonId ? "Update the lesson content." : "Add a new lesson to this content."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={lessonForm.handleSubmit(handleAddLesson)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lessonTitle">Title</Label>
                <Input
                  id="lessonTitle"
                  {...lessonForm.register("title")}
                  placeholder="e.g., Introduction"
                />
                {lessonForm.formState.errors.title && (
                  <p className="text-sm text-destructive">{lessonForm.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lessonDuration">Duration (min)</Label>
                <Input
                  id="lessonDuration"
                  type="number"
                  {...lessonForm.register("estimatedMinutes", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonBody">Content (Markdown)</Label>
              <Textarea
                id="lessonBody"
                {...lessonForm.register("body")}
                placeholder="Write the lesson content here using Markdown..."
                rows={12}
                className="font-mono text-sm"
              />
              {lessonForm.formState.errors.body && (
                <p className="text-sm text-destructive">{lessonForm.formState.errors.body.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetLessonForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={lessonSubmitting}>
                {lessonSubmitting ? "Saving..." : editingLessonId ? "Update Lesson" : "Add Lesson"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Dialog */}
      <AlertDialog open={deleteLessonDialogOpen} onOpenChange={setDeleteLessonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingLesson?.title}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { ContentEditorPage as ContentEditor };
