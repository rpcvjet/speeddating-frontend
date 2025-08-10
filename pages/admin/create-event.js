// pages/admin/create-event.js
import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Upload, Plus, Trash2, Save, ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

const CreateEvent = () => {
  const { user } = useAuth();

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
    type: 'speed_dating'
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
  const [currentStep, setCurrentStep] = useState(1); // 1: Event Info, 2: Add Participants
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [editingParticipant, setEditingParticipant] = useState(null);

  // API Configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

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

  // Add individual participant
  const addParticipant = () => {
    if (!newParticipant.name || !newParticipant.email || !newParticipant.phone) {
      alert('Please fill in name, email, and phone number');
      return;
    }

    const participant = {
      ...newParticipant,
      participant_id: `temp_${Date.now()}`,
      checked_in: false
    };

    setParticipants(prev => [...prev, participant]);
    setNewParticipant({
      name: '',
      email: '',
      phone: '',
      age: '',
      gender: '',
      mindbody_id: ''
    });
  };

  // Remove participant
  const removeParticipant = (participantId) => {
    setParticipants(prev => prev.filter(p => p.participant_id !== participantId));
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
      mindbody_id: participant.mindbody_id
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

  // Update participant
  const updateParticipant = () => {
    if (!newParticipant.name || !newParticipant.email || !newParticipant.phone) {
      alert('Please fill in name, email, and phone number');
      return;
    }

    setParticipants(prev =>
      prev.map(p =>
        p.participant_id === editingParticipant.participant_id
          ? { ...p, ...newParticipant }
          : p
      )
    );

    // Clear editing state
    cancelEditing();
  };

  // Handle CSV upload
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCsvFile(file);
      // Here you would parse the CSV and add participants
      // For now, just show the filename
      alert(`CSV uploaded: ${file.name}. CSV parsing will be implemented with backend.`);
    }
  };

  // Sample CSV data for demo
  const addSampleParticipants = () => {
    const sampleData = [
      { name: 'Sarah Johnson', email: 'sarah@email.com', phone: '+1-555-0101', age: '28', gender: 'Female', mindbody_id: 'MB001' },
      { name: 'Mike Chen', email: 'mike@email.com', phone: '+1-555-0102', age: '32', gender: 'Male', mindbody_id: 'MB002' },
      { name: 'Emma Davis', email: 'emma@email.com', phone: '+1-555-0103', age: '29', gender: 'Female', mindbody_id: 'MB003' },
      { name: 'James Wilson', email: 'james@email.com', phone: '+1-555-0104', age: '31', gender: 'Male', mindbody_id: 'MB004' }
    ];

    const newParticipants = sampleData.map(p => ({
      ...p,
      participant_id: `temp_${Date.now()}_${Math.random()}`,
      checked_in: false
    }));

    setParticipants(prev => [...prev, ...newParticipants]);
  };

  // Create event - UPDATED TO USE REAL API
  const createEvent = async () => {
    if (!eventInfo.name || !eventInfo.date || !eventInfo.time || !eventInfo.venue) {
      alert('Please fill in all required event information');
      return;
    }

    if (participants.length === 0) {
      alert('Please add at least one participant');
      return;
    }

    if (!user?.token) {
      alert('Please log in again');
      window.location.href = '/login';
      return;
    }

    setLoading(true);

    try {
      console.log('Creating event with:', { eventInfo, participants: participants.length });

      // Call your actual Lambda function
      const response = await fetch(`${API_BASE_URL}/events/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          eventInfo: {
            ...eventInfo,
            // Convert string numbers to integers
            age_min: eventInfo.age_min ? parseInt(eventInfo.age_min) : null,
            age_max: eventInfo.age_max ? parseInt(eventInfo.age_max) : null,
            max_participants: parseInt(eventInfo.max_participants) || 20
          },
          participants: participants.map(p => ({
            ...p,
            // Convert age to integer if provided
            age: p.age ? parseInt(p.age) : null
          }))
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
      }

      const result = await response.json();
      console.log('Success result:', result);

      if (result.success) {
        alert(`✅ Event created successfully!\n\nEvent: ${result.event_name}\nEvent ID: ${result.event_id}\nParticipants: ${result.participant_count}`);

        // Redirect to events list
        window.location.href = '/admin/events';
      } else {
        throw new Error(result.message || 'Failed to create event');
      }

    } catch (error) {
      console.error('Error creating event:', error);
      alert(`❌ Error creating event:\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center">
                <Link href="/admin/events">
                  <button className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
                  <p className="mt-2 text-gray-600">Set up your speed dating event and add participants</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Step Progress */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  1
                </div>
                <span className="ml-2 font-medium">Event Details</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
              <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  2
                </div>
                <span className="ml-2 font-medium">Add Participants</span>
              </div>
            </div>
          </div>

          {/* Step 1: Event Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Event Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Singles Night - Ages 25-35"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={eventInfo.name}
                    onChange={(e) => handleEventInfoChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={eventInfo.venue}
                    onChange={(e) => handleEventInfoChange('venue', e.target.value)}
                  >
                    <option value="">Select a venue</option>
                    <option value="Bethesda Location">Bethesda Location</option>
                    <option value="D.C. Location">D.C. Location</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={eventInfo.date}
                    onChange={(e) => handleEventInfoChange('date', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={eventInfo.time}
                    onChange={(e) => handleEventInfoChange('time', e.target.value)}
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={eventInfo.age_min}
                      onChange={(e) => handleEventInfoChange('age_min', e.target.value)}
                    />
                    <span className="flex items-center text-gray-500">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={eventInfo.age_max}
                      onChange={(e) => handleEventInfoChange('age_max', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={eventInfo.max_participants}
                    onChange={(e) => handleEventInfoChange('max_participants', parseInt(e.target.value))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Optional event description..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={eventInfo.description}
                    onChange={(e) => handleEventInfoChange('description', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Next: Add Participants
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Add Participants */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Participant Entry Options */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Add Participants</h3>

                {/* Upload Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <h4 className="text-sm font-medium text-gray-900">CSV Upload</h4>
                    <p className="text-xs text-gray-500 mb-3">Upload participant list</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="cursor-pointer px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                    >
                      Choose File
                    </label>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <h4 className="text-sm font-medium text-gray-900">Mindbody Sync</h4>
                    <p className="text-xs text-gray-500 mb-3">Import from Mindbody</p>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">
                      Coming Soon
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Plus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <h4 className="text-sm font-medium text-gray-900">Sample Data</h4>
                    <p className="text-xs text-gray-500 mb-3">Add demo participants</p>
                    <button
                      onClick={addSampleParticipants}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                    >
                      Add Sample
                    </button>
                  </div>
                </div>

                {/* Individual Participant Form */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    {editingParticipant ? 'Edit Participant' : 'Add Individual Participant'}
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
                      placeholder="Phone * (+1-555-0123)"
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
              </div>

              {/* Participants List */}
              {participants.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Participants ({participants.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participants.map((participant) => (
                          <tr key={participant.participant_id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Back to Event Details
                </button>

                <button
                  onClick={createEvent}
                  disabled={loading || participants.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Creating Event...' : 'Create Event'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CreateEvent;