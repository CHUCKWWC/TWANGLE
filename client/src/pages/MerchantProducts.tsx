import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle, Package, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

/**
 * PRODUCT CREATION PAGE
 * 
 * This page allows merchants to:
 * 1. View their existing products
 * 2. Create new products for sale
 * 
 * Products are created at the platform level (not on connected account)
 * and mapped to the merchant's connected account in the database
 */

const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().optional(),
  priceInCents: z.number().min(50, "Price must be at least $0.50"),
  currency: z.string().default("usd"),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function MerchantProducts() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      priceInCents: 1000, // $10.00 default
      currency: "usd",
    },
  });

  // Fetch merchant's products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/stripe-connect/my-products'],
  });

  // Fetch account status
  const { data: accountStatus } = useQuery({
    queryKey: ['/api/stripe-connect/account-status'],
  });

  // Mutation to create product
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      return await apiRequest('POST', '/api/stripe-connect/product', data);
    },
    onSuccess: () => {
      toast({
        title: "Product Created",
        description: "Your product has been added to the marketplace",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stripe-connect/my-products'] });
      form.reset();
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const priceInDollars = form.watch("priceInCents") / 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!accountStatus?.hasAccount) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Alert data-testid="alert-no-account">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to create a merchant account first before you can create products.
            <Button asChild className="ml-4" size="sm">
              <a href="/merchant/onboard">Create Merchant Account</a>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!accountStatus?.chargesEnabled) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Alert data-testid="alert-not-onboarded">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to complete onboarding before you can create products.
            <Button asChild className="ml-4" size="sm">
              <a href="/merchant/onboard">Complete Onboarding</a>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">My Products</h1>
          <p className="text-muted-foreground">
            Create and manage products for sale in the marketplace
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          data-testid="button-toggle-form"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showCreateForm ? "Cancel" : "Create Product"}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-8" data-testid="card-create-product">
          <CardHeader>
            <CardTitle>Create New Product</CardTitle>
            <CardDescription>
              Add a product to the marketplace. The platform will collect a 10% fee on each sale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Premium Widget"
                          data-testid="input-product-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your product..."
                          data-testid="textarea-product-description"
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
                  name="priceInCents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="number"
                            placeholder="1000"
                            data-testid="input-price-cents"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                          <div className="text-sm space-y-1">
                            <p className="text-muted-foreground">
                              Enter price in cents. ${formatPrice(field.value)} USD
                            </p>
                            <p className="text-muted-foreground">
                              You'll receive: ${formatPrice(Math.round(field.value * 0.9))} (90%)
                            </p>
                            <p className="text-muted-foreground">
                              Platform fee: ${formatPrice(Math.round(field.value * 0.1))} (10%)
                            </p>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  data-testid="button-submit-product"
                >
                  {createProductMutation.isPending ? "Creating..." : "Create Product"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && !showCreateForm ? (
        <Card data-testid="card-no-products">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No products yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first product to start selling
            </p>
            <Button onClick={() => setShowCreateForm(true)} data-testid="button-create-first-product">
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product: any) => (
            <Card key={product.id} data-testid={`card-product-${product.id}`}>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                {product.description && (
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    ${formatPrice(product.priceInCents)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Your earnings: ${formatPrice(Math.round(product.priceInCents * 0.9))}</p>
                    <p>Platform fee: ${formatPrice(Math.round(product.priceInCents * 0.1))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
