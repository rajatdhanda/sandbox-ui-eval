import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Baby, 
  Settings, 
  BarChart3, 
  Database, 
  Shield, 
  FileText, 
  Bell, 
  Calendar, 
  MessageCircle, 
  TrendingUp, 
  BookOpen,
  LogOut,
  X,
  Plus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

// Mock data - replace with your Supabase service calls
const mockData = {
  stats: {
    totalUsers: 47,
    totalChildren: 23,
    totalClasses: 6,
    totalTeachers: 8,
    totalParents: 35,
    activeUsers: 42,
  },
  notifications: [
    {
      id: '1',
      title: 'New Parent Registration',
      message: 'Sarah Johnson has registered for the Toddler A class',
      type: 'info',
      created_at: new Date().toISOString(),
      is_read: false
    },
    {
      id: '2',
      title: 'Attendance Alert',
      message: 'Low attendance in Preschool B today',
      type: 'warning',
      created_at: new Date().toISOString(),
      is_read: false
    }
  ],
  announcements: [
    {
      id: '1',
      title: 'Holiday Schedule Update',
      content: 'Please note the updated holiday schedule for December',
      type: 'general',
      publish_date: new Date().toISOString()
    }
  ],
  upcomingEvents: [
    {
      id: '1',
      title: 'Parent-Teacher Conference',
      start_date: new Date(Date.now() + 86400000).toISOString(),
      location: 'Main Hall'
    }
  ]
};

const AdminDashboard = () => {
  const [activeModule, setActiveModule] = useState(null);
  const [showModule, setShowModule] = useState(false);
  const [stats, setStats] = useState(mockData.stats);
  const [notifications, setNotifications] = useState(mockData.notifications);
  const [announcements, setAnnouncements] = useState(mockData.announcements);
  const [upcomingEvents, setUpcomingEvents] = useState(mockData.upcomingEvents);
  const [loading, setLoading] = useState(false);

  // Mock user data
  const user = { full_name: 'Admin User', role: 'admin' };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Replace with actual Supabase calls using your database service
      // const [statsData, notificationsData, announcementsData, eventsData] = await Promise.all([
      //   db.read('users', { select: 'role, is_active' }),
      //   db.read('notifications', { filters: { user_id: user.id }, limit: 5 }),
      //   db.read('announcements', { limit: 3, orderBy: [{ column: 'created_at', ascending: false }] }),
      //   db.read('events', { filters: { start_date: { operator: 'gte', value: new Date() } }, limit: 3 })
      // ]);
      
      // Process and set data here
      console.log('Dashboard data loaded');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // await signOut();
      console.log('User logged out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const openModule = (module) => {
    setActiveModule(module);
    setShowModule(true);
  };

  const closeModule = () => {
    setActiveModule(null);
    setShowModule(false);
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'urgent': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#8B5CF6';
    }
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'users':
        return <UserManagementModule />;
      case 'children':
        return <ChildrenManagementModule />;
      case 'classes':
        return <ClassManagementModule />;
      case 'curriculum':
        return <CurriculumManagementModule />;
      default:
        return <div className="p-8 text-center text-gray-500">Module content will be loaded here</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, {user.full_name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* System Overview */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: Baby, label: 'Students', value: stats.totalChildren, color: 'text-pink-600', bg: 'bg-pink-50' },
              { icon: Settings, label: 'Classes', value: stats.totalClasses, color: 'text-orange-600', bg: 'bg-orange-50' },
              { icon: Users, label: 'Teachers', value: stats.totalTeachers, color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Users, label: 'Parents', value: stats.totalParents, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: Shield, label: 'Active Users', value: stats.activeUsers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-2xl font-semibold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Management Modules */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Management Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              {
                id: 'users',
                icon: Users,
                title: 'User Management',
                description: 'Manage parents, teachers, and admin accounts',
                color: 'text-purple-600',
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                hover: 'hover:border-purple-300'
              },
              {
                id: 'children',
                icon: Baby,
                title: 'Student Management',
                description: 'View and manage student profiles and enrollment',
                color: 'text-pink-600',
                bg: 'bg-pink-50',
                border: 'border-pink-200',
                hover: 'hover:border-pink-300'
              },
              {
                id: 'classes',
                icon: Settings,
                title: 'Class Management',
                description: 'Manage classes, schedules, and teacher assignments',
                color: 'text-orange-600',
                bg: 'bg-orange-50',
                border: 'border-orange-200',
                hover: 'hover:border-orange-300'
              },
              {
                id: 'curriculum',
                icon: BookOpen,
                title: 'Curriculum Management',
                description: 'Create, schedule, and assign comprehensive learning plans',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                hover: 'hover:border-emerald-300'
              },
              {
                id: 'photos',
                icon: Database,
                title: 'Photo Management',
                description: 'Upload, tag, and organize student photos',
                color: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border-red-200',
                hover: 'hover:border-red-300'
              },
              {
                id: 'attendance',
                icon: Users,
                title: 'Attendance Management',
                description: 'Track daily attendance and check-in/out times',
                color: 'text-violet-600',
                bg: 'bg-violet-50',
                border: 'border-violet-200',
                hover: 'hover:border-violet-300'
              },
              {
                id: 'config',
                icon: Database,
                title: 'Configuration',
                description: 'Manage dropdown fields and system settings',
                color: 'text-green-600',
                bg: 'bg-green-50',
                border: 'border-green-200',
                hover: 'hover:border-green-300'
              },
              {
                id: 'reports',
                icon: BarChart3,
                title: 'Reports & Analytics',
                description: 'View system reports and analytics',
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                border: 'border-indigo-200',
                hover: 'hover:border-indigo-300'
              }
            ].map((module) => (
              <button
                key={module.id}
                onClick={() => openModule(module.id)}
                className={`bg-white rounded-xl p-6 shadow-sm border-2 ${module.border} ${module.hover} transition-all duration-200 hover:shadow-md text-left group`}
              >
                <div className={`w-12 h-12 ${module.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <module.icon className={`w-6 h-6 ${module.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{module.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Recent Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            </div>
            <div className="p-6">
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent notifications</p>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getNotificationColor(notification.type) + '20' }}
                      >
                        <Bell className="w-4 h-4" style={{ color: getNotificationColor(notification.type) }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
            </div>
            <div className="p-6">
              {announcements.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent announcements</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-blue-400 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{announcement.title}</h4>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {announcement.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{announcement.content}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(announcement.publish_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            </div>
            <div className="p-6">
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming events</p>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-purple-600 font-medium mt-1">
                          {new Date(event.start_date).toLocaleDateString()} at{' '}
                          {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {event.location && (
                          <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Summary */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-semibold text-gray-900 mb-1">{Math.floor(stats.activeUsers * 0.8)}</p>
                <p className="text-sm text-gray-600">Active Users Today</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-pink-600" />
                </div>
                <p className="text-2xl font-semibold text-gray-900 mb-1">23</p>
                <p className="text-sm text-gray-600">Messages Sent</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-2xl font-semibold text-gray-900 mb-1">
                  {notifications.filter(n => !n.is_read).length}
                </p>
                <p className="text-sm text-gray-600">Unread Notifications</p>
              </div>
            </div>
          </div>
        </section>

        {/* System Health */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Database Status', value: 'Online', status: 'healthy' },
                { label: 'Server Status', value: 'Healthy', status: 'healthy' },
                { label: 'Last Backup', value: '2 hours ago', status: 'healthy' },
                { label: 'Storage Used', value: '2.4 GB / 10 GB', status: 'healthy' },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Module Modal */}
      {showModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeModule === 'users' && 'User Management'}
                {activeModule === 'children' && 'Student Management'}
                {activeModule === 'classes' && 'Class Management'}
                {activeModule === 'curriculum' && 'Curriculum Management'}
                {!['users', 'children', 'classes', 'curriculum'].includes(activeModule) && 'Module'}
              </h2>
              <button
                onClick={closeModule}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              {renderModule()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Placeholder modules - these will be fully implemented next
const UserManagementModule = () => {
  const UserManagement = () => {
    // Import the full UserManagement component here
    return React.createElement('div', { className: 'p-6' }, 'User Management Module - Full implementation available');
  };
  return React.createElement(UserManagement);
};

const ChildrenManagementModule = () => {
  const ChildrenManagement = () => {
    // Import the full ChildrenManagement component here
    return React.createElement('div', { className: 'p-6' }, 'Children Management Module - Full implementation available');
  };
  return React.createElement(ChildrenManagement);
};

const ClassManagementModule = () => (
  <div className="p-6">
    <div className="text-center py-12">
      <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Class Management</h3>
      <p className="text-gray-600">Full class management interface will be implemented here</p>
    </div>
  </div>
);

const CurriculumManagementModule = () => (
  <div className="p-6">
    <div className="text-center py-12">
      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Curriculum Management</h3>
      <p className="text-gray-600">Full curriculum management interface will be implemented here</p>
    </div>
  </div>
);

export default AdminDashboard;