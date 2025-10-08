import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, Globe, Activity } from "lucide-react";
import { format } from "date-fns";

interface AccessSummary {
  totalAccess: number;
  uniqueUsers: number;
}

interface CountryStats {
  country: string;
  countryCode: string;
  count: number;
}

interface UserStats {
  userId: string;
  email: string;
  displayName: string;
  count: number;
  lastAccess: string;
}

interface AccessLog {
  id: string;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  ipAddress: string;
  country: string | null;
  city: string | null;
  location: string | null;
  accessType: string;
  createdAt: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Reports() {
  const { data: summary } = useQuery<AccessSummary>({
    queryKey: ['/api/reports/access-summary'],
  });

  const { data: countryStats = [] } = useQuery<CountryStats[]>({
    queryKey: ['/api/reports/access-stats-country'],
  });

  const { data: userStats = [] } = useQuery<UserStats[]>({
    queryKey: ['/api/reports/access-stats-user'],
  });

  const { data: recentLogs = [] } = useQuery<AccessLog[]>({
    queryKey: ['/api/reports/access-logs'],
  });

  const topCountries = countryStats.slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-reports-title">Access & Usage Reports</h1>
          <p className="text-muted-foreground" data-testid="text-reports-description">
            Comprehensive analytics on app usage and geographic distribution
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Access Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-access">{summary?.totalAccess ?? 0}</div>
              <p className="text-xs text-muted-foreground">All recorded access events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-unique-users">{summary?.uniqueUsers ?? 0}</div>
              <p className="text-xs text-muted-foreground">Authenticated users who accessed the app</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Countries</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-countries-count">{countryStats.length}</div>
              <p className="text-xs text-muted-foreground">Geographic reach</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Access by Country</CardTitle>
            <CardDescription>Top 10 countries by access count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCountries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="countryCode" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {topCountries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access by User</CardTitle>
            <CardDescription>User activity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Access Count</TableHead>
                  <TableHead className="text-right">Last Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStats.map((user) => (
                  <TableRow key={user.userId} data-testid={`row-user-${user.userId}`}>
                    <TableCell className="font-medium">{user.displayName || 'Unknown'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-right">{user.count}</TableCell>
                    <TableCell className="text-right">
                      {format(new Date(user.lastAccess), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Access Logs</CardTitle>
            <CardDescription>Latest 100 access events</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>{log.displayName || log.email || 'Anonymous'}</TableCell>
                    <TableCell>{log.location || log.country || 'Unknown'}</TableCell>
                    <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        log.accessType === 'authenticated' 
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
                          : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                      }`}>
                        {log.accessType}
                      </span>
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
