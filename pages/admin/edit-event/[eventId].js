// pages/admin/edit-event/[eventId].js - WORKING VERSION WITH CORRECT API CALLS
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Trash2, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';

const EditEvent = () => {
  const router = useRouter();
  const { eventId } = router.query;
  const { user, logout } = useAuth();

  // Event basic info
  const [eventInfo, setEventInfo] = useState({
    name: '',
    date: '',
    time: '',
    venue: '',
    description: '',
    age_min: '',
    age_max: '',
    max_participants: 20,
    price: '',
    type: 'speed_dating',
    status: 'upcoming'
  });

  // Participants list
  const [participants, setParticipants] = useState([]);

  // Form for adding individual participant
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    mindbody_id: ''
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [error, setError] = useState(null);

  // API Configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // Load event data from real API
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId || !user?.token) return;

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching event data for:', eventId);

        // Fetch event details
        const eventResponse = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        });

        console.log('Event response status:', eventResponse.status);

        if (!eventResponse.ok) {
          if (eventResponse.status === 404) {
            throw new Error('Event not found');
          }
          if (eventResponse.status === 401) {
            logout();
            return;
          }
          throw new Error(`Failed to load event: ${eventResponse.status}`);
        }

        const eventData = await eventResponse.json();
        console.log('Event data received:', eventData);

        if (eventData.success && eventData.event) {
          setEventInfo(eventData.event);
          // Set participants if they come with the event data
          if (eventData.participants) {
            setParticipants(eventData.participants);
            console.log('Participants from event data:', eventData.participants.length);
          }
        } else {
          throw new Error('Invalid event data received');
        }

        // Try to fetch participants separately (if not included in event data)
        if (!eventData.participants || eventData.participants.length === 0) {
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
              console.log('Separate participants data:', participantsData);

              if (participantsData.success && participantsData.participants) {
                setParticipants(participantsData.participants);
                console.log('Participants loaded separately:', participantsData.participants.length);
              }
            }
          } catch (participantsError) {
            console.log('Could not load participants separately:', participantsError);
            // Not a critical error - participants might just not exist
          }
        }

      } catch (error) {
        console.error('Error fetching event data:', error);
        setError(error.message);

        // If event not found, redirect back to events list
        if (error.message.includes('not found')) {
          setTimeout(() => router.push('/admin/events'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, user?.token, API_BASE_URL]);

  // Handle event info changes
  const handleEventInfoChange = (field, value) => {
    setEventInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle participant form changes
  const handleParticipantChange = (field, value) => {
    setNewParticipant(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add individual participant using batch endpoint
  const addParticipant = async () => {
    if (!newParticipant.name || !newParticipant.email || !newParticipant.phone) {
      alert('Please fill in name, email, and phone number');
      return;
    }

    try {
      console.log('Adding participant:', newParticipant);

      // Using batch create endpoint for single participant
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/participants/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          participants: [newParticipant]
        })
      });

      console.log('Add participant response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Failed to add participant: ${response.status}`);
      }

      const data = await response.json();
      console.log('Add participant response:', data);

      if (data.success) {
        // Add the new participant to local state
        const newParticipantData = data.participants && data.participants.length > 0
          ? data.participants[0]
          : {
            ...newParticipant,
            participant_id: `temp_${Date.now()}`,
            checked_in: false,
            created_at: new Date().toISOString()
          };

        setParticipants(prev => [...prev, newParticipantData]);

        // Clear the form
        setNewParticipant({
          name: '',
          email: '',
          phone: '',
          age: '',
          gender: '',
          mindbody_id: ''
        });

        alert(`Participant "${newParticipant.name}" added successfully!`);
      } else {
        throw new Error(data.message || 'Failed to add participant');
      }

    } catch (error) {
      console.error('Error adding participant:', error);
      alert(`Error adding participant: ${error.message}`);
    }
  };

  // Start editing participant
  const startEditingParticipant = (participant) => {
    setEditingParticipant(participant);
    setNewParticipant({
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      age: participant.age,
      gender: participant.gender,
      mindbody_id: participant.mindbody_id || ''
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingParticipant(null);
    setNewParticipant({
      name: '',
      email: '',
      phone: '',
      age: '',
      gender: '',
      mindbody_id: ''
    });
  };

  // Update participant - WORKAROUND: Use the event update endpoint
  const updateParticipant = async () => {
    if (!newParticipant.name || !newParticipant.email || !newParticipant.phone) {
      alert('Please fill in name, email, and phone number');
      return;
    }

    try {
      console.log('Updating participant:', editingParticipant.participant_id);

      // Update local state first
      const updatedParticipants = participants.map(p =>
        p.participant_id === editingParticipant.participant_id
          ? { ...p, ...newParticipant }
          : p
      );

      // Use the event update endpoint to sync all participants
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          eventInfo: eventInfo,
          participants: updatedParticipants
        })
      });

      console.log('Update participant response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Failed to update participant: ${response.status}`);
      }

      const data = await response.json();
      console.log('Update participant response:', data);

      if (data.success) {
        // Update local state
        setParticipants(updatedParticipants);
        cancelEditing();
        alert('Participant updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update participant');
      }

    } catch (error) {
      console.error('Error updating participant:', error);
      alert(`Error updating participant: ${error.message}`);
    }
  };

  // Remove participant - WORKAROUND: Use the event update endpoint
  const removeParticipant = async (participantId) => {
    if (!confirm('Are you sure you want to remove this participant?')) {
      return;
    }

    try {
      console.log('Removing participant:', participantId);

      // Update local state first
      const updatedParticipants = participants.filter(p => p.participant_id !== participantId);

      // Use the event update endpoint to sync all participants
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          eventInfo: eventInfo,
          participants: updatedParticipants
        })
      });

      console.log('Remove participant response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Failed to remove participant: ${response.status}`);
      }

      const data = await response.json();
      console.log('Remove participant response:', data);

      if (data.success) {
        // Update local state
        setParticipants(updatedParticipants);
        alert('Participant removed successfully!');
      } else {
        throw new Error(data.message || 'Failed to remove participant');
      }

    } catch (error) {
      console.error('Error removing participant:', error);
      alert(`Error removing participant: ${error.message}`);
    }
  };

  // Save event changes to real API
  const saveEvent = async () => {
    if (!eventInfo.name || !eventInfo.date || !eventInfo.time || !eventInfo.venue) {
      alert('Please fill in all required event information');
      return;
    }

    setSaving(true);

    try {
      console.log('Saving event:', eventId);

      // Use the correct update endpoint
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          eventInfo: eventInfo,
          participants: participants
        })
      });

      console.log('Save event response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Failed to update event: ${response.status}`);
      }

      const data = await response.json();
      console.log('Save event response:', data);

      if (data.success) {
        alert('Event updated successfully!');
        router.push('/admin/events');
      } else {
        throw new Error(data.message || 'Failed to update event');
      }

    } catch (error) {
      console.error('Error updating event:', error);
      alert(`Error updating event: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Check if editing is allowed based on status
  const canEditBasicInfo = eventInfo.status === 'upcoming' || eventInfo.status === 'active';
  const canEditDateTimeVenue = eventInfo.status === 'upcoming';
  const canAddRemoveParticipants = eventInfo.status !== 'completed';

  // Get status badge styling
  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
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
            <strong className="font-bold">Error loading event: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <div className="space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link href="/admin/events">
              <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                Back to Events
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                  <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
                  <p className="mt-2 text-gray-600">Modify event details and manage participants</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(eventInfo.status)}`}>
                  {eventInfo.status}
                </span>
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs text-gray-500">
                    ID: {eventId} | Participants: {participants.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug section - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 rounded mb-4 text-sm">
            <strong>Debug Info:</strong>
            <br />API Base URL: {API_BASE_URL}
            <br />Event ID: {eventId}
            <br />User Token: {user?.token ? '✓ Present' : '✗ Missing'}
            <br />Event Status: {eventInfo.status}
            <br />Participants Loaded: {participants.length}
          </div>
        )}

        {/* Status Warning */}
        {eventInfo.status !== 'upcoming' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {eventInfo.status === 'active' ? 'Event is Active' : 'Event is Completed'}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {eventInfo.status === 'active'
                    ? 'Some editing options are limited while the event is active. You can still add participants and modify basic details.'
                    : 'This event is completed. No changes are allowed.'
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Event Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Singles Night - Ages 25-35"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditBasicInfo ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                value={eventInfo.name}
                onChange={(e) => handleEventInfoChange('name', e.target.value)}
                disabled={!canEditBasicInfo}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue *
              </label>
              <select
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditDateTimeVenue ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                value={eventInfo.venue}
                onChange={(e) => handleEventInfoChange('venue', e.target.value)}
                disabled={!canEditDateTimeVenue}
              >
                <option value="">Select a venue</option>
                <option value="Bethesda">Bethesda</option>
                <option value="D.C.">D.C.</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditDateTimeVenue ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                value={eventInfo.date}
                onChange={(e) => handleEventInfoChange('date', e.target.value)}
                disabled={!canEditDateTimeVenue}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditDateTimeVenue ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                value={eventInfo.time}
                onChange={(e) => handleEventInfoChange('time', e.target.value)}
                disabled={!canEditDateTimeVenue}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditBasicInfo ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={eventInfo.age_min}
                  onChange={(e) => handleEventInfoChange('age_min', e.target.value)}
                  disabled={!canEditBasicInfo}
                />
                <span className="flex items-center text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditBasicInfo ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={eventInfo.age_max}
                  onChange={(e) => handleEventInfoChange('age_max', e.target.value)}
                  disabled={!canEditBasicInfo}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants
              </label>
              <input
                type="number"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditBasicInfo ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                value={eventInfo.max_participants}
                onChange={(e) => handleEventInfoChange('max_participants', parseInt(e.target.value))}
                disabled={!canEditBasicInfo}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Optional event description..."
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditBasicInfo ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                value={eventInfo.description}
                onChange={(e) => handleEventInfoChange('description', e.target.value)}
                disabled={!canEditBasicInfo}
              />
            </div>
          </div>
        </div>

        {/* Participants Management */}
        {canAddRemoveParticipants && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Manage Participants</h3>

            {/* Individual Participant Form */}
            <div className="border-b pb-6 mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                {editingParticipant ? 'Edit Participant' : 'Add Participant'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newParticipant.name}
                  onChange={(e) => handleParticipantChange('name', e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newParticipant.email}
                  onChange={(e) => handleParticipantChange('email', e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Phone *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newParticipant.phone}
                  onChange={(e) => handleParticipantChange('phone', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Age"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newParticipant.age}
                  onChange={(e) => handleParticipantChange('age', e.target.value)}
                />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newParticipant.gender}
                  onChange={(e) => handleParticipantChange('gender', e.target.value)}
                >
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>

                {editingParticipant ? (
                  <div className="flex gap-2">
                    <button
                      onClick={updateParticipant}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                    >
                      Update
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={addParticipant}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>

            {/* Participants List */}
            {participants.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Current Participants ({participants.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {participants.map((participant) => (
                        <tr key={participant.participant_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {participant.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {participant.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {participant.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {participant.age}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {participant.gender}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${participant.checked_in
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}>
                              {participant.checked_in ? 'Checked In' : 'Not Checked In'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditingParticipant(participant)}
                                className="text-blue-600 hover:text-blue-900 px-2 py-1 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => removeParticipant(participant.participant_id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Link href="/admin/events">
            <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
              Cancel
            </button>
          </Link>

          {canEditBasicInfo && (
            <button
              onClick={saveEvent}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap with ProtectedRoute for authentication
const ProtectedEditEvent = () => {
  return (
    <ProtectedRoute>
      <EditEvent />
    </ProtectedRoute>
  );
};

export default ProtectedEditEvent;