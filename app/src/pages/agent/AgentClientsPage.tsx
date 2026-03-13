import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usersAPI } from '@/services/api';
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  FileText,
  TrendingUp,
  UserPlus,
  Loader2,
} from 'lucide-react';

export function AgentClientsPage() {
  const { user } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const response = await usersAPI.getMyClients();
        const fetchedClients = response.data?.clients || [];
        setClients(fetchedClients);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const firstName = client.firstName || '';
    const lastName = client.lastName || '';
    const email = client.email || '';
    const matchesSearch = 
      firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  
  const totalClients = clients.length;
  const totalRevenue = clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalApplications = clients.reduce((sum, c) => sum + (c.applications || 0), 0);
  
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
            My Clients
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage clients referred through your code
          </p>
        </div>
        <div className="flex items-center gap-2 p-3 bg-[#d4af37]/10 rounded-lg">
          <span className="text-sm text-slate-600 dark:text-slate-400">Your Referral Code:</span>
          <span className="font-mono font-bold text-[#d4af37]">{user?.referralCode || 'N/A'}</span>
        </div>
      </motion.div>
      
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Clients</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalClients}</p>
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
                <p className="text-sm text-slate-500">Total Applications</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalApplications}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-[#d4af37]">₦{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#d4af37]" />
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
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" className="h-9">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </motion.div>
      
      {/* Clients List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Client List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#0a9396]" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No clients yet
                </h3>
                <p className="text-slate-500 mb-4">
                  Share your referral code to start earning commissions
                </p>
                <div className="p-4 bg-[#d4af37]/10 rounded-lg inline-block">
                  <p className="font-mono font-bold text-[#d4af37]">{user?.referralCode}</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Client</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Contact</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase">Applications</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase hidden sm:table-cell">Total Spent</th>
                      <th className="text-left py-3 px-3 lg:px-4 text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 lg:px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-[#0a9396] to-[#005f73] flex items-center justify-center text-white font-bold text-xs lg:text-sm flex-shrink-0">
                              {(client.firstName || '').charAt(0)}{(client.lastName || '').charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{client.firstName} {client.lastName}</p>
                              <p className="text-xs text-slate-500 truncate">{client.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 lg:px-4 hidden md:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{client.phone || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 lg:px-4">
                          <Badge className="bg-[#0a9396]/10 text-[#0a9396] text-xs">
                            {client.applications || 0}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 lg:px-4 hidden sm:table-cell font-medium text-slate-900 dark:text-white text-sm whitespace-nowrap">
                          ₦{(client.totalSpent || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 lg:px-4 hidden lg:table-cell text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

