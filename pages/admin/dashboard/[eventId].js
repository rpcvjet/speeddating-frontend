// pages/admin/dashboard/[eventId].js - Complete with User Menu
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Search, Users, Clock, CheckCircle, Circle, UserCheck, Mail, Phone, ArrowLeft, Calendar, MapPin, Play, Square, Edit, Send, Zap, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';

const EventDashboard = () => {
  const router = useRouter();
  const { eventId } = router.query;
  const { user, logout } = useAuth(); // Add logout function

  // Event data - will be fetched based on eventId AND organization_id
  const [currentEvent, setCurrentEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectionProgress, setSelectionProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userMenuOpen, setUserMenuOpen] = useState(false); // Add user menu state

  // API Configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // Refresh participants and selection progress
  const refreshParticipants = async () => {
    if (!eventId || !user?.token) return;

    try {
      const participantsResponse = await fetch(`${API_BASE_URL}/events/${eventId}/participants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        if (participantsData.success) {
          const organizationParticipants = (participantsData.participants || []).filter(
            participant => participant.organization_id === user.organization_id
          );
          setParticipants(organizationParticipants);

          // Set selection progress data if available
          if (participantsData.selection_progress) {
            setSelectionProgress(participantsData.selection_progress);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing participants:', error);
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Fetch event and participants data with organization filtering
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId || !user?.token) return;

      setLoading(true);

      try {
        // Fetch event details
        const eventResponse = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!eventResponse.ok) {
          throw new Error(`Failed to fetch event: ${eventResponse.status}`);
        }

        const eventData = await eventResponse.json();
        console.log('Event data received:', eventData);

        if (!eventData.success || !eventData.event) {
          throw new Error('Event not found or invalid response');
        }

        const event = eventData.event;

        // CRITICAL: Verify event belongs to user's organization
        if (event.organization_id !== user.organization_id) {
          console.error('Access denied: Event does not belong to user organization');
          alert('Access denied: You do not have permission to view this event.');
          router.push('/admin/events');
          return;
        }

        setCurrentEvent(event);

        // Fetch participants for this event
        const participantsResponse = await fetch(`${API_BASE_URL}/events/${eventId}/participants`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!participantsResponse.ok) {
          throw new Error(`Failed to fetch participants: ${participantsResponse.status}`);
        }

        const participantsData = await participantsResponse.json();
        console.log('Participants data received:', participantsData);

        if (participantsData.success) {
          // Extra security layer - filter participants by organization
          const organizationParticipants = (participantsData.participants || []).filter(
            participant => participant.organization_id === user.organization_id
          );
          setParticipants(organizationParticipants);

          // Set selection progress data if available
          if (participantsData.selection_progress) {
            setSelectionProgress(participantsData.selection_progress);
          }
        } else {
          // No participants is OK for a new event
          setParticipants([]);
        }

      } catch (error) {
        console.error('Error fetching event data:', error);
        alert(`Error loading event: ${error.message}`);
        router.push('/admin/events');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, user?.token, user?.organization_id, router, API_BASE_URL]);

  // Filter participants based on search and status
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'checked_in') return matchesSearch && participant.checked_in;
    if (filterStatus === 'not_checked_in') return matchesSearch && !participant.checked_in;
    return matchesSearch;
  });

  // Toggle check-in status
  const toggleCheckIn = async (participantId) => {
    try {
      const participant = participants.find(p => p.participant_id === participantId);
      const newCheckedInStatus = !participant.checked_in;

      const response = await fetch(`${API_BASE_URL}/participants/${participantId}/checkin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          checked_in: newCheckedInStatus
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update check-in status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setParticipants(prev =>
          prev.map(p =>
            p.participant_id === participantId
              ? { ...p, checked_in: newCheckedInStatus }
              : p
          )
        );
      } else {
        throw new Error(data.message || 'Failed to update check-in status');
      }

    } catch (error) {
      console.error('Error toggling check-in:', error);
      alert(`Error updating check-in status: ${error.message}`);
    }
  };

  // Statistics
  const totalParticipants = participants.length;
  const checkedInCount = participants.filter(p => p.checked_in).length;
  const maleCount = participants.filter(p => p.gender === 'Male').length;
  const femaleCount = participants.filter(p => p.gender === 'Female').length;

  // Send selection links (post-event)
  const sendSelectionLinks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/send-selection-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to send selection links: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        alert(`✅ Selection links sent successfully!\n\n📱 ${data.sms_sent || data.emails_sent} messages sent\n⏰ Links expire at: ${new Date(data.expires_at).toLocaleString()}`);
        // Refresh data to show updated selection progress
        refreshParticipants();
      } else {
        throw new Error(data.message || 'Failed to send selection links');
      }

    } catch (error) {
      console.error('Error sending selection links:', error);
      alert(`Error sending selection links: ${error.message}`);
    }
  };

  // Process matches
  const processMatches = async () => {
    if (!confirm('Are you sure you want to process matches for this event? This will run the matching algorithm and create final match results.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/process-matches/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to process matches: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(`✅ Matches processed successfully!\n\n` +
          `📊 ${result.summary.total_participants} participants\n` +
          `💕 ${result.summary.romantic_matches} romantic matches\n` +
          `👥 ${result.summary.platonic_matches} platonic matches\n` +
          `🎯 ${result.summary.participants_with_matches}/${result.summary.total_participants} got matches (${result.summary.match_rate}% rate)\n\n` +
          `You can now send results to participants.`);
      } else {
        throw new Error(result.message || 'Failed to process matches');
      }

    } catch (error) {
      console.error('Error processing matches:', error);
      alert(`Error processing matches: ${error.message}`);
    }
  };

  // Send match results
  const sendMatchResults = async () => {
    if (!confirm('Are you sure you want to send match results to all participants? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/send-match-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to send match results: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(`✅ Match results sent successfully!\n\n` +
          `📊 ${result.participants_count} participants\n` +
          `💕 ${result.romantic_matches} romantic matches\n` +
          `👥 ${result.platonic_matches} platonic matches\n` +
          `📧 ${result.notifications.emails_sent} emails sent\n` +
          `🎯 ${result.match_rate} match rate`);
      } else {
        throw new Error(result.message || 'Failed to send match results');
      }

    } catch (error) {
      console.error('Error sending match results:', error);
      alert(`Error sending match results: ${error.message}`);
    }
  };

  // Change event status
  const changeEventStatus = async (newStatus) => {
    const statusMessages = {
      active: 'start this event',
      completed: 'end this event'
    };

    const confirmMessage = `Are you sure you want to ${statusMessages[newStatus]}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update event status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        setCurrentEvent(prev => ({ ...prev, status: newStatus }));

        const successMessages = {
          active: 'Event started! You can now check in participants.',
          completed: 'Event ended! No further check-ins are allowed.'
        };

        alert(`✅ ${successMessages[newStatus]}`);
      } else {
        throw new Error(data.message || 'Failed to update event status');
      }

    } catch (error) {
      console.error('Error changing event status:', error);
      alert(`Error updating event status: ${error.message}`);
    }
  };

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Event Not Found</h2>
          <p className="mt-2 text-gray-600">The requested event could not be found or you don't have access to it.</p>
          <Link href="/admin/events">
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Back to Events
            </button>
          </Link>
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
              <div className="flex items-center">
                <Link href="/admin/events">
                  <button className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{currentEvent.name}</h1>
                  <p className="mt-2 text-gray-600">
                    Event Management Dashboard • {user?.organization_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Status Control Buttons */}
                {currentEvent.status === 'upcoming' && (
                  <button
                    onClick={() => changeEventStatus('active')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Event
                  </button>
                )}

                {currentEvent.status === 'active' && (
                  <button
                    onClick={() => changeEventStatus('completed')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    End Event
                  </button>
                )}

                {/* Edit Event Button */}
                <Link href={`/admin/edit-event/${eventId}`}>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Event
                  </button>
                </Link>

                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(currentEvent.status)}`}>
                  {currentEvent.status}
                </span>

                {/* User Menu */}
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{user?.name}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        {/* User Info Section */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                          <p className="text-xs text-gray-400">{user?.organization_name}</p>
                        </div>

                        {/* Menu Items */}
                        <Link href="/admin/account-settings">
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Account Settings
                          </button>
                        </Link>

                        <Link href="/admin/events">
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Calendar className="w-4 h-4 mr-3" />
                            All Events
                          </button>
                        </Link>

                        <div className="border-t border-gray-100">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                              router.push('/login');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Details Card */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-3" />
              <div>
                <p className="text-sm font-medium">Date & Time</p>
                <p className="text-sm">{formatDate(currentEvent.date)}</p>
                <p className="text-sm">{currentEvent.time}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-3" />
              <div>
                <p className="text-sm font-medium">Venue</p>
                <p className="text-sm">{currentEvent.venue}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <Users className="w-5 h-5 mr-3" />
              <div>
                <p className="text-sm font-medium">Age Range</p>
                <p className="text-sm">{currentEvent.age_min}-{currentEvent.age_max} years</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <UserCheck className="w-5 h-5 mr-3" />
              <div>
                <p className="text-sm font-medium">Capacity</p>
                <p className="text-sm">{totalParticipants}/{currentEvent.max_participants} registered</p>
              </div>
            </div>
          </div>

          {currentEvent.description && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">{currentEvent.description}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registered</p>
                <p className="text-2xl font-bold text-gray-900">{totalParticipants}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Checked In</p>
                <p className="text-2xl font-bold text-gray-900">{checkedInCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">M</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Male</p>
                <p className="text-2xl font-bold text-gray-900">{maleCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-pink-600 font-bold">F</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Female</p>
                <p className="text-2xl font-bold text-gray-900">{femaleCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Progress Card (show only if selection links have been sent) */}
        {selectionProgress && (
          <div className="bg-white rounded-lg shadow mb-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Selection Progress</h3>
              <button
                onClick={refreshParticipants}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                🔄 Refresh Status
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{selectionProgress.completion_rate}</p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{selectionProgress.completed_sessions}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{selectionProgress.pending_sessions}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{selectionProgress.total_sessions}</p>
                <p className="text-sm text-gray-600">Total Sent</p>
              </div>
            </div>

            {selectionProgress.selection_deadline && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⏰ Selection deadline: {new Date(selectionProgress.selection_deadline).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-medium text-gray-900">Participant Check-In</h3>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search participants..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filter */}
                <select
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Participants</option>
                  <option value="checked_in">Checked In</option>
                  <option value="not_checked_in">Not Checked In</option>
                </select>

                {/* Send Links Button */}
                <button
                  onClick={sendSelectionLinks}
                  disabled={checkedInCount === 0 || currentEvent.status !== 'completed'}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  title={currentEvent.status !== 'completed' ? 'Event must be completed to send selection links' : checkedInCount === 0 ? 'No participants checked in' : ''}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Selection Links
                </button>

                {/* Process Matches Button */}
                <button
                  onClick={processMatches}
                  disabled={!selectionProgress}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  title={!selectionProgress ? 'Send selection links first before processing matches' : 'Run matching algorithm'}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Process Matches
                </button>

                {/* Send Match Results Button */}
                <button
                  onClick={sendMatchResults}
                  disabled={!selectionProgress}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  title={!selectionProgress ? 'Send selection links first before sending results' : 'Send match results to participants'}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Results
                </button>
              </div>
            </div>
          </div>

          {/* Participants List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selection Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.map((participant) => (
                  <tr key={participant.participant_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {participant.checked_in ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`ml-2 text-sm font-medium ${participant.checked_in ? 'text-green-600' : 'text-gray-500'
                          }`}>
                          {participant.checked_in ? 'Checked In' : 'Not Checked In'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                      <div className="text-sm text-gray-500">ID: {participant.mindbody_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="w-4 h-4 mr-1" />
                        {participant.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Phone className="w-4 h-4 mr-1" />
                        {participant.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Age: {participant.age}</div>
                      <div className="text-sm text-gray-500">{participant.gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {participant.selection_link_sent ? (
                        <div className="flex items-center">
                          {participant.selection_status === 'completed' ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              <div>
                                <span className="text-sm font-medium text-green-600">Completed</span>
                                {participant.selection_submitted_at && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(participant.selection_submitted_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-orange-500 mr-2" />
                              <span className="text-sm font-medium text-orange-600">Pending</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No link sent</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleCheckIn(participant.participant_id)}
                        disabled={currentEvent.status !== 'active'}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${participant.checked_in
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        title={currentEvent.status !== 'active' ? 'Event must be active to check in participants' : ''}
                      >
                        {participant.checked_in ? 'Check Out' : 'Check In'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredParticipants.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No participants found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No participants match the current filter.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap the component with ProtectedRoute for authentication
const ProtectedEventDashboard = () => {
  return (
    <ProtectedRoute>
      <EventDashboard />
    </ProtectedRoute>
  );
};

export default ProtectedEventDashboard;