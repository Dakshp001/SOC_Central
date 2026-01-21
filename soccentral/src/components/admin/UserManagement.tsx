// frontend/src/components/admin/UserManagement.tsx - ENHANCED WITH VIRTUAL DOM CONCEPTS
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { User, normalizeUser } from "@/types/auth";
import { Users, Database, Settings, Building2 } from "lucide-react";

// Import modular components
import { UserManagementHeader } from "./UserManagementHeader";
import { UserStatsCards } from "./UserStatsCards";
import { UserSearchFilter } from "./UserSearchFilter";
import { UserTable } from "./UserTable";
import { SecurityNotice } from "./SecurityNotice";
import { DataResetManagement } from "./DataResetManagement";
import { SystemSettings } from "./SystemSettings";
import { CompanyDataUpload } from "./CompanyDataUpload";
import { CompanyDataStatus } from "./CompanyDataStatus";
import { CompanyManagement } from "./CompanyManagement";
import { CreateUserForm } from "./CreateUserForm";
import { UserDetailView } from "./UserDetailView";

export const UserManagement: React.FC = () => {
  const {
    listUsers,
    promoteUser,
    demoteUser,
    toggleUserStatus,
    deleteUser, // Add deleteUser from AuthContext
    canManageUsers,
    user: currentUser,
    signOut,
  } = useAuth();

  // ✅ Virtual DOM State Management
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Filters
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // ✅ Virtual DOM: Memoized filtered users for performance
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(term) ||
        (user.full_name || `${user.first_name} ${user.last_name}`)
          .toLowerCase()
          .includes(term) ||
        user.company_name.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term);

      const matchesCompany =
        companyFilter === "all" || user.company_name === companyFilter;
      const matchesRole =
        roleFilter === "all" || user.role === (roleFilter as any);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? user.is_active : !user.is_active);

      return matchesSearch && matchesCompany && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, companyFilter, roleFilter, statusFilter]);

  // Derive company list options from users
  const companyOptions = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.company_name) set.add(u.company_name);
    });
    return Array.from(set).sort();
  }, [users]);

  const clearFilters = useCallback(() => {
    setCompanyFilter("all");
    setRoleFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
  }, []);

  // ✅ Virtual DOM: Auto-refresh mechanism
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Check if user is super admin for data management access
  const isSuperAdmin = currentUser?.role === "super_admin";

  // Load users on component mount
  useEffect(() => {
    if (!canManageUsers()) {
      toast({
        title: "Access Denied",
        description: "Master Admin or Super Admin privileges required.",
        variant: "destructive",
      });
      return;
    }

    fetchUsers();
  }, []);

  // ✅ Virtual DOM: Optimized fetchUsers with caching and diffing
  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    
    try {
      console.log("📄 Fetching users...");
      const response = await listUsers();
      if (response.success && response.users) {
        // Normalize users to ensure all required properties are present
        const normalizedUsers = response.users.map(normalizeUser);

        // ✅ Virtual DOM: Only update if data actually changed (shallow comparison)
        setUsers(prevUsers => {
          const hasChanged = 
            prevUsers.length !== normalizedUsers.length ||
            prevUsers.some((user, index) => 
              user.id !== normalizedUsers[index]?.id || 
              user.email !== normalizedUsers[index]?.email ||
              user.is_active !== normalizedUsers[index]?.is_active ||
              user.role !== normalizedUsers[index]?.role
            );
          
          if (hasChanged) {
            console.log("🔄 Users data changed, updating Virtual DOM");
            setLastUpdated(new Date());
            return normalizedUsers;
          }
          
          console.log("✅ Users data unchanged, skipping Virtual DOM update");
          return prevUsers;
        });

        console.log(
          "📋 Loaded users:",
          normalizedUsers.length,
          "First user ID type:",
          typeof normalizedUsers[0]?.id
        );
      } else {
        console.log("❌ Failed to load users:", response.message);
        if (!silent) {
          toast({
            title: "Failed to Load Users",
            description: response.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("💥 Fetch users error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [listUsers]);

  // ✅ Virtual DOM: Auto-refresh mechanism
  const startAutoRefresh = useCallback(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
    }
    
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        console.log("🔄 Auto-refreshing user data...");
        fetchUsers(true); // Silent refresh
      }, 30000); // Refresh every 30 seconds
    }
  }, [autoRefresh, fetchUsers]);

  // ✅ Virtual DOM: Cleanup auto-refresh on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, []);

  // ✅ Virtual DOM: Start auto-refresh when component mounts or autoRefresh changes
  useEffect(() => {
    startAutoRefresh();
  }, [startAutoRefresh]);

  const handlePromoteUser = async (userId: string) => {
    setActionLoading(`promote-${userId}`);
    try {
      console.log("📈 Promoting user with ID:", userId, "Type:", typeof userId);
      const response = await promoteUser(userId);
      if (response.success) {
        await fetchUsers(); // Refresh the list
      } else {
        toast({
          title: "Promotion Failed",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Promote user error:", error);
      toast({
        title: "Error",
        description: "Failed to promote user.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteUser = async (userId: string) => {
    setActionLoading(`demote-${userId}`);
    try {
      console.log("📉 Demoting user with ID:", userId, "Type:", typeof userId);
      const response = await demoteUser(userId);
      if (response.success) {
        await fetchUsers(); // Refresh the list
      } else {
        toast({
          title: "Demotion Failed",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Demote user error:", error);
      toast({
        title: "Error",
        description: "Failed to demote user.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserStatus = async (userId: string, newStatus: boolean) => {
    const action = newStatus ? "activate" : "deactivate";
    setActionLoading(`${action}-${userId}`);

    try {
      console.log(
        `🔄 ${action}ing user with ID:`,
        userId,
        "New status:",
        newStatus
      );

      // Call the toggleUserStatus function from AuthContext with the new status
      const response = await toggleUserStatus(userId, newStatus);

      if (response.success) {
        await fetchUsers(); // Refresh the list
        toast({
          title: `User ${newStatus ? "Activated" : "Deactivated"} Successfully`,
          description: `The user has been ${
            newStatus ? "activated" : "deactivated"
          }.`,
        });
      } else {
        toast({
          title: `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`💥 Toggle user status error:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} user.`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Virtual DOM: Enhanced delete with optimistic updates
  const handleDeleteUser = async (userId: string) => {
    setActionLoading(`delete-${userId}`);

    // Find user for confirmation message and optimistic update
    const userToDelete = users.find(u => u.id === userId);
    const userName = userToDelete ? 
      (userToDelete.full_name || `${userToDelete.first_name} ${userToDelete.last_name}`) : 
      'User';

    try {
      console.log("🗑️ Deleting user with ID:", userId);

      // ✅ Virtual DOM: Optimistic update - remove from UI immediately
      const originalUsers = users;
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      setLastUpdated(new Date());

      // Show immediate feedback
      toast({
        title: "Deleting User...",
        description: `Removing ${userName} from the system.`,
        variant: "default",
      });

      // Call the deleteUser function from AuthContext
      const response = await deleteUser(userId);

      if (response.success) {
        // ✅ Virtual DOM: Confirm the optimistic update worked
        console.log("✅ User deletion confirmed by server");
        toast({
          title: "User Deleted Successfully",
          description: `${userName} has been permanently removed from the system.`,
          variant: "default",
        });
        
        // Force a fresh fetch to ensure data consistency
        setTimeout(() => fetchUsers(true), 1000);
      } else {
        // ✅ Virtual DOM: Rollback optimistic update on failure
        console.error("❌ Server rejected deletion, rolling back");
        setUsers(originalUsers);
        toast({
          title: "Delete Failed",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Delete user error:", error);
      // ✅ Virtual DOM: Rollback on network/other errors
      const originalUsers = users.find(u => u.id === userId) ? users : [...users, userToDelete!];
      setUsers(originalUsers);
      toast({
        title: "Error",
        description: "Failed to delete user. Changes have been reverted.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Virtual DOM: Toggle auto-refresh functionality
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => {
      const newState = !prev;
      toast({
        title: newState ? "Auto-refresh Enabled" : "Auto-refresh Disabled",
        description: newState ? "User data will refresh every 30 seconds" : "Auto-refresh has been turned off",
        variant: "default",
      });
      return newState;
    });
  }, []);

  const handleNavigateToDataManagement = () => {
    setActiveTab("data");
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleBackToUserList = () => {
    setSelectedUser(null);
  };

  // Permission check - show access denied if not authorized
  if (!canManageUsers()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            You do not have permission to access user management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black w-full">
      <div className="user-management-container px-4 py-6 space-y-6 w-full max-w-none">
      {/* Header with Theme Toggle and Navigation */}
      <UserManagementHeader
        isLoading={isLoading}
        onRefresh={() => fetchUsers(false)}
        onSignOut={signOut}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={toggleAutoRefresh}
        lastUpdated={lastUpdated}
      />

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger
            value="companies"
            className="flex items-center gap-2"
            disabled={!isSuperAdmin}
          >
            <Building2 className="h-4 w-4" />
            Company Management
          </TabsTrigger>
          <TabsTrigger
            value="company-upload"
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Company Upload
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="flex items-center gap-2"
            disabled={!isSuperAdmin}
          >
            <Database className="h-4 w-4" />
            Data Management
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          {selectedUser ? (
            /* Show User Detail View */
            <UserDetailView 
              user={selectedUser} 
              onBack={handleBackToUserList} 
            />
          ) : (
            <>
              {/* Stats Cards */}
              <UserStatsCards users={users} />

              {/* Create User Form or Search Filter */}
              {showCreateUserForm ? (
                <CreateUserForm
                  onUserCreated={(user) => {
                    setShowCreateUserForm(false);
                    fetchUsers(); // Refresh the user list
                    toast({
                      title: "User Created Successfully! 🎉",
                      description: `${user.first_name} ${user.last_name} has been added to the system.`,
                    });
                  }}
                  onCancel={() => setShowCreateUserForm(false)}
                  defaultCompany={currentUser?.company_name}
                />
              ) : (
                <>
                  {/* Search Filter */}
                  <UserSearchFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onCreateUser={() => setShowCreateUserForm(true)}
                    canCreateUsers={currentUser?.role === 'admin' || currentUser?.role === 'super_admin'}
                    companyOptions={companyOptions}
                    companyFilter={companyFilter}
                    onCompanyFilterChange={setCompanyFilter}
                    roleFilter={roleFilter}
                    onRoleFilterChange={setRoleFilter}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    resultsCount={filteredUsers.length}
                    onClearFilters={clearFilters}
                  />

                  {/* Users Table with Click Handler */}
                  <UserTable
                    users={filteredUsers}
                    isLoading={isLoading}
                    searchTerm={searchTerm}
                    currentUserId={currentUser?.id}
                    actionLoading={actionLoading}
                    onPromoteUser={handlePromoteUser}
                    onDemoteUser={handleDemoteUser}
                    onToggleUserStatus={handleToggleUserStatus}
                    onDeleteUser={handleDeleteUser}
                    onUserClick={handleUserClick}
                  />
                </>
              )}

              {/* Security Notice */}
              <SecurityNotice />
            </>
          )}
        </TabsContent>

        {/* Company Management Tab */}
        <TabsContent value="companies" className="space-y-6">
          {isSuperAdmin ? (
            <CompanyManagement />
          ) : (
            <div className="flex items-center justify-center py-12">
              <Alert className="max-w-md">
                <Building2 className="h-4 w-4" />
                <AlertDescription>
                  Super Admin privileges required to access company management.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </TabsContent>

        {/* Company Data Upload Tab */}
        <TabsContent value="company-upload" className="space-y-6">
          <CompanyDataStatus />
          <CompanyDataUpload onDataUploaded={fetchUsers} />
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data" className="space-y-6">
          {isSuperAdmin ? (
            <DataResetManagement />
          ) : (
            <div className="flex items-center justify-center py-12">
              <Alert className="max-w-md">
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Super Admin privileges required to access data management
                  features.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </TabsContent>

        {/* System Settings Tab - Now using the modular component */}
        <TabsContent value="settings" className="space-y-6">
          <SystemSettings
            currentUser={currentUser}
            isLoading={isLoading}
            isSuperAdmin={isSuperAdmin}
            onRefreshUsers={fetchUsers}
            onNavigateToDataManagement={handleNavigateToDataManagement}
            onSignOut={signOut}
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default UserManagement;