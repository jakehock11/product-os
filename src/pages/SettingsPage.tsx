import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Settings, Trash2, Download, Moon, Sun, Monitor } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { setCurrentProduct, exitProduct } = useProductContext();
  const { data: product, isLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  useEffect(() => {
    if (product) {
      setName(product.name);
    }
  }, [product]);

  const handleSaveName = async () => {
    if (!product || !name.trim()) return;
    setIsSaving(true);
    try {
      await updateProduct.mutateAsync({ ...product, name: name.trim() });
      toast({ title: "Saved", description: "Product name updated." });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productId) return;
    try {
      await deleteProduct.mutateAsync(productId);
      toast({ title: "Deleted", description: "Product has been deleted." });
      exitProduct();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Product not found</p>
      </div>
    );
  }

  return (
    <div className="page-container scrollbar-thin">
      <div className="page-header">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your product and preferences
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-4">
        {/* Product Settings */}
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Product Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your product configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="productName" className="text-sm">Product Name</Label>
              <div className="flex gap-2">
                <Input
                  id="productName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product name"
                  className="h-9 text-sm"
                />
                <Button
                  size="sm"
                  className="h-9"
                  onClick={handleSaveName}
                  disabled={isSaving || name === product.name}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {theme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
              Appearance
            </CardTitle>
            <CardDescription className="text-xs">
              Customize how Product OS looks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <Label className="text-sm">Theme</Label>
              <RadioGroup value={theme} onValueChange={(v) => setTheme(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2 text-sm font-normal">
                    <Sun className="h-3.5 w-3.5" />
                    Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2 text-sm font-normal">
                    <Moon className="h-3.5 w-3.5" />
                    Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-2 text-sm font-normal">
                    <Monitor className="h-3.5 w-3.5" />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Export Defaults */}
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Download className="h-4 w-4" />
              Export Defaults
            </CardTitle>
            <CardDescription className="text-xs">
              Default settings for exports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Include parent context by default</Label>
                <p className="text-xs text-muted-foreground">
                  Include linked problems/hypotheses in incremental exports
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-xs">
              Irreversible actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Delete this product</Label>
                <p className="text-xs text-muted-foreground">
                  Permanently delete all data for "{product.name}"
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-8 text-xs">
                    Delete Product
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base">Delete "{product.name}"?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      This will permanently delete all problems, hypotheses, experiments,
                      decisions, artifacts, and captures. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteProduct}
                      className="h-9 bg-destructive text-sm text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Forever
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
