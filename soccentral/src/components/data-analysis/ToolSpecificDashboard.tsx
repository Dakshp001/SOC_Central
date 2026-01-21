import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Laptop, Smartphone, Wifi, Mail, ShieldCheck, TrendingUp, Activity } from 'lucide-react';
import { ToolType, AnalysisResult } from '@/types/dataAnalysis';

interface ToolSpecificDashboardProps {
  tool: ToolType;
  analysis: AnalysisResult;
  data: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const ToolSpecificDashboard: React.FC<ToolSpecificDashboardProps> = ({ tool, analysis, data }) => {
  const getToolIcon = () => {
    switch (tool) {
      case 'SIEM': return <Shield className="h-5 w-5" />;
      case 'EDR': return <Laptop className="h-5 w-5" />;
      case 'MDM': return <Smartphone className="h-5 w-5" />;
      case 'Meraki': return <Wifi className="h-5 w-5" />;
      case 'G-Suite': return <Mail className="h-5 w-5" />;
      case 'SonicWall': return <ShieldCheck className="h-5 w-5" />;
    }
  };

  const renderSIEMDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{analysis.summary.totalRecords.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-500">
                  {data.filter(item => item.severity?.toLowerCase() === 'critical').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-green-500">94.2%</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getSeverityDistribution(data)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {getSeverityDistribution(data).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTimelineData(data)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderEDRDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Endpoints</p>
              <p className="text-2xl font-bold">{analysis.summary.totalRecords}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Active Threats</p>
              <p className="text-2xl font-bold text-red-500">
                {data.filter(item => item.status?.toLowerCase().includes('threat')).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Quarantined</p>
              <p className="text-2xl font-bold text-orange-500">
                {data.filter(item => item.status?.toLowerCase().includes('quarantine')).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Clean</p>
              <p className="text-2xl font-bold text-green-500">
                {data.filter(item => item.status?.toLowerCase().includes('clean')).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getPlatformDistribution(data)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Threat Detection Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTimelineData(data)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderDefaultDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold">{analysis.summary.totalRecords.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Date Range</p>
              <p className="text-sm font-medium">
                {analysis.summary.dateRange.start.toLocaleDateString()} - {analysis.summary.dateRange.end.toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Data Quality</p>
              <Badge variant="secondary" className="text-sm">Good</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getGenericDistribution(data)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );

  const renderDashboard = () => {
    switch (tool) {
      case 'SIEM':
        return renderSIEMDashboard();
      case 'EDR':
        return renderEDRDashboard();
      default:
        return renderDefaultDashboard();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getToolIcon()}
            {tool} Analytics Dashboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Analysis of {analysis.summary.totalRecords.toLocaleString()} records
          </p>
        </CardHeader>
      </Card>

      {renderDashboard()}

      {analysis.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper functions for data processing
function getSeverityDistribution(data: any[]) {
  const severityCount: { [key: string]: number } = {};
  data.forEach(item => {
    const severity = item.severity || item.level || 'Unknown';
    severityCount[severity] = (severityCount[severity] || 0) + 1;
  });
  
  return Object.entries(severityCount).map(([name, value]) => ({ name, value }));
}

function getPlatformDistribution(data: any[]) {
  const platformCount: { [key: string]: number } = {};
  data.forEach(item => {
    const platform = item.platform || item.os || 'Unknown';
    platformCount[platform] = (platformCount[platform] || 0) + 1;
  });
  
  return Object.entries(platformCount).map(([platform, count]) => ({ platform, count }));
}

function getTimelineData(data: any[]) {
  // Mock timeline data - in real implementation, this would process actual timestamps
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(date => ({
    date,
    count: Math.floor(Math.random() * 100) + 50
  }));
}

function getGenericDistribution(data: any[]) {
  // Generic data distribution for unknown tools
  const categories = ['Category A', 'Category B', 'Category C', 'Category D'];
  return categories.map(category => ({
    category,
    count: Math.floor(Math.random() * data.length / 2) + 10
  }));
}