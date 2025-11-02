import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Mail, CheckCircle2, XCircle, Clock, Lock } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@shared/adminAccess";

interface EmailDeliveryStats {
  totalSent: number;
  totalSuccess: number;
  totalFailed: number;
  byType: Record<string, { sent: number; success: number; failed: number }>;
}

interface EmailSendLog {
  id: string;
  userId: string;
  email: string;
  emailType: string;
  subType: string | null;
  status: string;
  errorMessage: string | null;
  metadata: any;
  sentAt: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function EmailMonitoring() {
  const { user } = useAuth();
  const hasAccess = isAdminUser(user?.email);

  const { data: emailStats } = useQuery<EmailDeliveryStats>({
    queryKey: ['/api/analytics/email-delivery-stats'],
    enabled: hasAccess,
  });

  const { data: emailLogs = [] } = useQuery<EmailSendLog[]>({
    queryKey: ['/api/analytics/email-send-logs'],
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
                You don't have permission to view email monitoring. This page is only available to authorized administrators.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  const successRate = emailStats && emailStats.totalSent > 0
    ? ((emailStats.totalSuccess / emailStats.totalSent) * 100).toFixed(1)
    : '0';

  const typeData = emailStats ? Object.entries(emailStats.byType).map(([type, stats]) => ({
    name: type.replace('_', ' '),
    sent: stats.sent,
    success: stats.success,
    failed: stats.failed,
  })) : [];

  const statusData = emailStats ? [
    { name: 'Success', value: emailStats.totalSuccess, fill: 'hsl(var(--chart-2))' },
    { name: 'Failed', value: emailStats.totalFailed, fill: 'hsl(var(--destructive))' },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-email-monitoring-title">Email Delivery Monitoring</h1>
          <p className="text-muted-foreground" data-testid="text-email-monitoring-description">
            Track email delivery success rates, failures, and engagement metrics
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-sent">{emailStats?.totalSent || 0}</div>
              <p className="text-xs text-muted-foreground">All-time emails sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-total-success">
                {emailStats?.totalSuccess || 0}
              </div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive" data-testid="text-total-failed">
                {emailStats?.totalFailed || 0}
              </div>
              <p className="text-xs text-muted-foreground">Delivery failures</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-success-rate">{successRate}%</div>
              <p className="text-xs text-muted-foreground">Overall delivery rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-delivery-status-title">Delivery Status Distribution</CardTitle>
              <CardDescription>Breakdown of successful vs failed deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No email data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle data-testid="text-email-types-title">Emails by Type</CardTitle>
              <CardDescription>Distribution across different email types</CardDescription>
            </CardHeader>
            <CardContent>
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="hsl(var(--chart-2))" name="Success" />
                    <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No email data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle data-testid="text-recent-logs-title">Recent Email Send Logs</CardTitle>
            <CardDescription>Last 100 email delivery attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {emailLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sub-Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium" data-testid={`text-log-email-${log.id}`}>
                          {log.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.emailType}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.subType ? (
                            <Badge variant="secondary">{log.subType}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.status === 'success' ? (
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.sentAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.errorMessage || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No email logs available
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
