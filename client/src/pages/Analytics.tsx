import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, TrendingUp, Users, Target, Lock } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@shared/adminAccess";

interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  lifetimeCustomers: number;
}

interface ConversionFunnel {
  totalSignups: number;
  freeToPaidConversions: number;
  conversionRate: number;
  averageTimeToConvert: number;
}

interface ConversionEvent {
  id: string;
  userId: string;
  email: string | null;
  eventType: string;
  fromPlan: string | null;
  toPlan: string | null;
  revenueImpact: number;
  createdAt: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Analytics() {
  const { user } = useAuth();
  const hasAccess = isAdminUser(user?.email);

  const { data: revenueMetrics } = useQuery<RevenueMetrics>({
    queryKey: ['/api/analytics/revenue-metrics'],
    enabled: hasAccess,
  });

  const { data: conversionFunnel } = useQuery<ConversionFunnel>({
    queryKey: ['/api/analytics/conversion-funnel'],
    enabled: hasAccess,
  });

  const { data: conversionEvents = [] } = useQuery<ConversionEvent[]>({
    queryKey: ['/api/analytics/conversion-events'],
    enabled: hasAccess,
  });

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto p-6">
          <Card className="max-w-md mx-auto mt-20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <Lock className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <CardTitle data-testid="text-access-denied">Access Denied</CardTitle>
              <CardDescription data-testid="text-access-denied-message">
                You don't have permission to view analytics. This page is only available to authorized administrators.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const funnelData = conversionFunnel ? [
    { name: 'Total Signups', value: conversionFunnel.totalSignups, fill: COLORS[0] },
    { name: 'Paid Conversions', value: conversionFunnel.freeToPaidConversions, fill: COLORS[1] },
  ] : [];

  const planDistribution = revenueMetrics ? [
    { name: 'Active Subscriptions', value: revenueMetrics.activeSubscriptions, fill: COLORS[2] },
    { name: 'Lifetime Access', value: revenueMetrics.lifetimeCustomers, fill: COLORS[3] },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-analytics-title">Revenue & Conversion Analytics</h1>
          <p className="text-muted-foreground" data-testid="text-analytics-description">
            Track revenue metrics, conversion rates, and business growth
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-mrr">
                {formatCurrency(revenueMetrics?.mrr || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Predictable monthly income</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-arr">
                {formatCurrency(revenueMetrics?.arr || 0)}
              </div>
              <p className="text-xs text-muted-foreground">MRR × 12</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                {formatCurrency(revenueMetrics?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">All-time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-conversion-rate">
                {conversionFunnel?.conversionRate.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Free → Paid conversion</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Signups vs. paid conversions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average time to convert:</span>
                  <span className="font-medium">{conversionFunnel?.averageTimeToConvert.toFixed(0) || 0} days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Distribution</CardTitle>
              <CardDescription>Active subscriptions vs. lifetime access</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Conversion Events</CardTitle>
            <CardDescription>Latest subscription lifecycle changes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead className="text-right">Revenue Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversionEvents.slice(0, 20).map((event) => (
                  <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(event.createdAt), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>{event.email || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        event.eventType === 'free_to_paid' 
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                          : event.eventType === 'paid_to_free'
                          ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                          : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                      }`}>
                        {event.eventType.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.fromPlan || 'null'} → {event.toPlan || 'null'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      event.revenueImpact > 0 ? 'text-green-600' : event.revenueImpact < 0 ? 'text-red-600' : ''
                    }`}>
                      {event.revenueImpact > 0 ? '+' : ''}{formatCurrency(event.revenueImpact)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
