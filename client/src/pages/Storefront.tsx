import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Store } from "lucide-react";

/**
 * STOREFRONT PAGE
 * 
 * This is the public marketplace where customers can:
 * 1. Browse all available products
 * 2. See merchant information
 * 3. Purchase products via Stripe Checkout
 * 
 * The checkout uses destination charges with a 10% application fee
 */

export default function Storefront() {
  const { toast } = useToast();

  // Fetch all products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/stripe-connect/products'],
  });

  // Mutation to create checkout session
  const checkoutMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      return await apiRequest('POST', '/api/stripe-connect/checkout', { productId, quantity });
    },
    onSuccess: (data: any) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
  });

  const handleBuyNow = (productId: string) => {
    checkoutMutation.mutate({ productId, quantity: 1 });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">Marketplace</h1>
        <p className="text-muted-foreground text-lg">
          Browse products from verified merchants
        </p>
      </div>

      {products.length === 0 ? (
        <Card data-testid="card-no-products">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Store className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">No products available yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Be the first merchant to add products to the marketplace!
            </p>
            <Button asChild>
              <a href="/merchant/onboard">Become a Merchant</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product: any) => (
            <Card key={product.id} data-testid={`card-product-${product.id}`} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <Badge variant="outline" className="ml-2 whitespace-nowrap">
                    {product.currency.toUpperCase()}
                  </Badge>
                </div>
                {product.description && (
                  <CardDescription className="line-clamp-3">
                    {product.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  <div>
                    <div className="text-3xl font-bold">
                      ${formatPrice(product.priceInCents)}
                      {product.productType === 'subscription' && product.billingInterval && (
                        <span className="text-lg text-muted-foreground">/{product.billingInterval}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {product.productType === 'subscription' ? (
                        <>
                          {product.billingInterval === 'month' ? 'Monthly subscription' : 'Yearly subscription'}
                          {product.trialDays > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {product.trialDays} day trial
                            </Badge>
                          )}
                        </>
                      ) : (
                        'per item'
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Sold by
                    </p>
                    <p className="text-sm font-medium">
                      {product.merchantName}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleBuyNow(product.id)}
                  disabled={checkoutMutation.isPending}
                  data-testid={`button-buy-${product.id}`}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {checkoutMutation.isPending ? "Loading..." : (
                    product.productType === 'subscription' ? 'Subscribe' : 'Buy Now'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Want to sell your own products?{" "}
          <a href="/merchant/onboard" className="text-primary hover:underline">
            Become a merchant
          </a>
        </p>
      </div>
    </div>
  );
}
