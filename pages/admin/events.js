// pages/admin/events.js - Connected to Real Backend API
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, Plus, Eye, Settings, Edit, Trash2, LogOut, } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

const EventsList = () => {
  const { user, logout } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [error, setError] = useState(null);

  // API Configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch events from your real Lambda API
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.token) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/events`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            // No events table or no events found - that's OK for a new system
            setEvents([]);
            return;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          setEvents(data.events || []);
        } else {
          // Handle case where there are simply no events yet
          if (data.message?.includes('No events') || data.count === 0) {
            setEvents([]);
          } else {
            throw new Error(data.message || 'Failed to fetch events');
          }
        }

      } catch (error) {
        console.error('Error fetching events:', error);
        setError(error.message);

        // If token is invalid, logout user
        if (error.message.includes('401') || error.message.includes('token')) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user?.token, API_BASE_URL]);

  // Create test data for development
  const createTestData = async () => {
    if (!confirm('This will create 3 test events with participants. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/seed-demo-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        alert(`✅ Created ${data.events_created} empty events! You can now add participants manually through the "Manage Event" buttons.`);
        // Refresh the events list
        window.location.reload();
      } else {
        throw new Error(data.message || 'Failed to create test data');
      }

    } catch (error) {
      console.error('Error creating test data:', error);
      alert(`Error creating test data: ${error.message}`);
    }
  };

  // Delete event using your real API
  const deleteEvent = async (eventId, eventName) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setEvents(prevEvents => prevEvents.filter(event => event.event_id !== eventId));
        alert(`Event "${eventName}" has been deleted.`);
      } else {
        throw new Error(data.message || 'Failed to delete event');
      }

    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Error deleting event: ${error.message}`);
    }
  };

  // Filter and sort events
  const filteredAndSortedEvents = events
    .filter(event => {
      if (filterStatus === 'all') return true;
      return event.status === filterStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.date) - new Date(b.date);
        case 'date_desc':
          return new Date(b.date) - new Date(a.date);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  // Get status badge styling
  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error loading events: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Organization Branding */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user?.organization_name} Events
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage all your speed dating events • Welcome back, {user?.name}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/admin/create-event">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Event
                  </button>
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link href="/admin/account-settings">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Account Settings">
                      <Settings className="w-5 h-5" />
                    </button>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats - Calculated from real data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.filter(e => e.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.reduce((sum, event) => sum + (event.total_registered || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Venues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(events.map(e => e.venue)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-medium text-gray-900">Your Events</h3>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Status Filter */}
                <select
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Events</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>

                {/* Sort */}
                <select
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="divide-y divide-gray-200">
            {filteredAndSortedEvents.map((event) => (
              <div key={event.event_id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{event.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(event.status)}`}>
                        {event.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(event.date)} at {event.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.venue}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {event.total_registered || 0} registered
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {event.checked_in || 0} checked in
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-6">
                    {/* View Dashboard Button */}
                    <Link href={`/admin/dashboard/${event.event_id}`}>
                      <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center">
                        <Eye className="w-4 h-4 mr-2" />
                        Manage Event
                      </button>
                    </Link>

                    {/* Edit Button */}
                    <Link href={`/admin/edit-event/${event.event_id}`}>
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Edit Event">
                        <Edit className="w-4 h-4" />
                      </button>
                    </Link>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteEvent(event.event_id, event.name)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredAndSortedEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filterStatus === 'all'
                  ? 'Create your first speed dating event to get started.'
                  : 'No events match the current filter.'}
              </p>
              <div className="mt-4 space-x-3">
                <Link href="/admin/create-event">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Create Your First Event
                  </button>
                </Link>
                {/* Test Data Button for Development */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={createTestData}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Create Test Data
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap with ProtectedRoute for authentication
const ProtectedEventsList = () => {
  return (
    <ProtectedRoute>
      <EventsList />
    </ProtectedRoute>
  );
};

export default ProtectedEventsList;