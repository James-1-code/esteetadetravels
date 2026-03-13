import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usersAPI } from '@/services/api';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await usersAPI.getAll({ limit: 100 });
        const fetchedUsers = response.data?.users || [];
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const email = user.email || '';
    const matchesSearch = 
      firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  
  const clients = filteredUsers.filter((u) => u.role === 'client');
  const agents = filteredUsers.filter((u) => u.role === 'agent');
  const pendingAgents = agents.filter((a) => a.adminApproved === false);
  
  const handleApproveAgent = async (userId: string) => {
    try {
      await usersAPI.approveAgent(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, adminApproved: true } : u))
      );
      toast.success('Agent approved successfully!');
    } catch (error: any) {
      console.error('Error approving agent:', error);
      toast.error('Failed to approve agent', {
        description: error.message || 'Please try again.',
      });
    }
  };
  
  const handleRejectAgent = async (userId: string) => {
    try {
      await usersAPI.rejectAgent(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, adminApproved: false } : u))
      );
      toast.success('Agent rejected');
    } catch (error: any) {
      console.error('Error rejecting agent:', error);
      toast.error('Failed to reject agent', {
        description: error.message || 'Please try again.',
      });
    }
  };
  
  const getStatusBadge = (user: any) => {
    if (user.role === 'agent') {
      // For agents, show pending if not approved
      if (user.adminApproved === false) {
        return <Badge className="bg-amber-100 text-amber-700">pending</Badge>;
      }
      return <Badge className="bg-green-100 text-green-700">active</Badge>;
    }
    // For clients and admins
    return <Badge className="bg-green-100 text-green-700">active</Badge>;
  };
  
  const UserTable = ({ data }: { data: typeof users }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">User</th>
            <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Contact</th>
            <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Role</th>
            <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
            <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Joined</th>
            <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="py-3 px-3 lg:px-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-[#0a9396] to-[#005f73] flex items-center justify-center text-white font-bold text-xs lg:text-sm flex-shrink-0">
                    {(user.firstName || '').charAt(0)}{(user.lastName || '').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{user.id}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-3 lg:px-4 hidden md:table-cell">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{user.phone || 'N/A'}</span>
                  </div>
                </div>
              </td>
              <td className="py-3 px-3 lg:px-4">
                <Badge className="capitalize bg-[#0a9396]/10 text-[#0a9396] text-xs">
                  {user.role}
                </Badge>
              </td>
              <td className="py-3 px-3 lg:px-4">
                {getStatusBadge(user)}
              </td>
              <td className="py-3 px-3 lg:px-4 hidden lg:table-cell text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </td>
              <td className="py-3 px-3 lg:px-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit User</DropdownMenuItem>
                    {user.role === 'agent' && user.adminApproved === false && (
                      <>
                        <DropdownMenuItem onClick={() => handleApproveAgent(user.id)} className="text-green-600">
                          <UserCheck className="w-4 h-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRejectAgent(user.id)} className="text-red-600">
                          <UserX className="w-4 h-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage all users on the platform
          </p>
        </div>
      </motion.div>
      
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#0a9396]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#0a9396]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Clients</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{clients.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Agents</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{agents.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#d4af37]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Agents</p>
                <p className="text-2xl font-bold text-amber-600">{pendingAgents.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </motion.div>
      
      {/* Users Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Users ({filteredUsers.length})</TabsTrigger>
            <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
            <TabsTrigger value="agents">Agents ({agents.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingAgents.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0a9396]" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No users found</p>
                  </div>
                ) : (
                  <UserTable data={filteredUsers} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clients">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0a9396]" />
                  </div>
                ) : (
                  <UserTable data={clients} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="agents">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0a9396]" />
                  </div>
                ) : (
                  <UserTable data={agents} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0a9396]" />
                  </div>
                ) : pendingAgents.length === 0 ? (
                  <div className="text-center py-16">
                    <UserCheck className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No pending agents</p>
                  </div>
                ) : (
                  <UserTable data={pendingAgents} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

