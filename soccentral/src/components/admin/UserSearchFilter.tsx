// frontend/src/components/admin/UserSearchFilter.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface UserSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateUser?: () => void;
  canCreateUsers?: boolean;
  // Filters
  companyOptions?: string[];
  companyFilter?: string;
  onCompanyFilterChange?: (value: string) => void;
  roleFilter?: string;
  onRoleFilterChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  resultsCount?: number;
  onClearFilters?: () => void;
}

export const UserSearchFilter: React.FC<UserSearchFilterProps> = ({ 
  searchTerm, 
  onSearchChange,
  onCreateUser,
  canCreateUsers = false,
  companyOptions = [],
  companyFilter = 'all',
  onCompanyFilterChange,
  roleFilter = 'all',
  onRoleFilterChange,
  statusFilter = 'all',
  onStatusFilterChange,
  resultsCount,
  onClearFilters
}) => {
  return (
    <Card className="sticky top-4 z-10">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <CardTitle>Search Users</CardTitle>
              {typeof resultsCount === 'number' && (
                <Badge variant="secondary" className="rounded-md">{resultsCount} results</Badge>
              )}
            </div>
            <CardDescription>Find users by email, name, company, role, or status</CardDescription>
            <div className="flex flex-wrap gap-2 pt-1">
              {companyFilter !== 'all' && <Badge variant="outline">Company: {companyFilter}</Badge>}
              {roleFilter !== 'all' && <Badge variant="outline">Role: {roleFilter.replace('_',' ')}</Badge>}
              {statusFilter !== 'all' && <Badge variant="outline">Status: {statusFilter}</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onClearFilters && (companyFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
              <Button variant="secondary" onClick={onClearFilters}>Clear Filters</Button>
            )}
            {canCreateUsers && onCreateUser && (
              <Button onClick={onCreateUser} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create User
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Filters</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={companyFilter} onValueChange={(v) => onCompanyFilterChange?.(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {companyOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={roleFilter} onValueChange={(v) => onRoleFilterChange?.(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="master_admin">Master Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange?.(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};