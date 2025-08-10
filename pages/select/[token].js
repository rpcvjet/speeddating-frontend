// pages/select/[token].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Heart, Users, X, Clock, CheckCircle, User } from 'lucide-react';

const ParticipantSelection = () => {
    const router = useRouter();
    const { token } = router.query;

    // State
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [currentParticipant, setCurrentParticipant] = useState(null);
    const [selectableParticipants, setSelectableParticipants] = useState([]);
    const [selections, setSelections] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [error, setError] = useState(null);

    // API Configuration
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

    // Load session data based on token
    useEffect(() => {
        const loadSessionData = async () => {
            if (!token) return;

            try {
                setLoading(true);
                setError(null);

                // Call your actual API endpoint
                const response = await fetch(`${API_BASE_URL}/selection-sessions/${token}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Invalid or expired selection link');
                        return;
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Session data received:', data);

                if (!data.success) {
                    setError(data.message || 'Invalid selection session');
                    return;
                }

                const session = data.session;
                const event = data.event;
                const otherParticipants = data.other_participants;

                // Check if expired
                const expiresAt = new Date(session.expires_at);
                const now = new Date();

                if (now > expiresAt || session.is_expired) {
                    setError('This selection link has expired');
                    return;
                }

                // Check if already completed
                if (session.is_completed) {
                    setError('You have already completed your selections for this event');
                    return;
                }

                // Set up the session data
                setSessionData({
                    session,
                    event,
                    participant: {
                        participant_id: session.participant_id,
                        name: currentParticipant?.name || 'Participant', // We might not have participant details in session
                        event_id: session.event_id
                    }
                });

                setSelectableParticipants(otherParticipants);

                // Initialize selections object
                const initialSelections = {};
                otherParticipants.forEach(p => {
                    initialSelections[p.participant_id] = null;
                });
                setSelections(initialSelections);

                // Calculate time remaining
                const timeLeft = expiresAt.getTime() - now.getTime();
                setTimeRemaining(timeLeft > 0 ? timeLeft : 0);

            } catch (error) {
                console.error('Error loading selection session:', error);
                setError('Error loading selection session. Please try again or contact support.');
            } finally {
                setLoading(false);
            }
        };

        loadSessionData();
    }, [token, API_BASE_URL]);

    // Countdown timer
    useEffect(() => {
        if (!timeRemaining || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1000) {
                    setError('Selection time has expired');
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    // Handle selection change
    const handleSelection = (participantId, selectionType) => {
        setSelections(prev => {
            const currentSelection = prev[participantId];

            if (selectionType === 'Pass') {
                // Pass overrides everything - clear other selections
                return {
                    ...prev,
                    [participantId]: 'Pass'
                };
            }

            // Handle Friend and Match selections
            if (currentSelection === 'Pass') {
                // If currently Pass, switch to the new selection
                return {
                    ...prev,
                    [participantId]: selectionType
                };
            }

            if (currentSelection === selectionType) {
                // Clicking the same button again - deselect it
                return {
                    ...prev,
                    [participantId]: null
                };
            }

            if (currentSelection === 'Friend' && selectionType === 'Match') {
                // Friend + Match = "Match & Friend"
                return {
                    ...prev,
                    [participantId]: 'Match & Friend'
                };
            }

            if (currentSelection === 'Match' && selectionType === 'Friend') {
                // Match + Friend = "Match & Friend"
                return {
                    ...prev,
                    [participantId]: 'Match & Friend'
                };
            }

            if (currentSelection === 'Match & Friend') {
                // If currently "Match & Friend", clicking Friend keeps only Match, clicking Match keeps only Friend
                if (selectionType === 'Friend') {
                    return {
                        ...prev,
                        [participantId]: 'Match'
                    };
                } else if (selectionType === 'Match') {
                    return {
                        ...prev,
                        [participantId]: 'Friend'
                    };
                }
            }

            // Default: set to the new selection
            return {
                ...prev,
                [participantId]: selectionType
            };
        });
    };

    // Submit selections
    const submitSelections = async () => {
        // Check if all selections are made
        const incompleteSelections = Object.values(selections).filter(s => s === null);
        if (incompleteSelections.length > 0) {
            alert('Please make a selection for all participants before submitting.');
            return;
        }

        setSubmitting(true);

        try {
            // Convert selections to API format
            const selectionsArray = Object.entries(selections).map(([participantId, selectionType]) => ({
                selected_participant_id: participantId,
                selection_type: selectionType
            }));

            console.log('Submitting selections:', selectionsArray);

            const response = await fetch(`${API_BASE_URL}/selection-sessions/${token}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ selections: selectionsArray }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Submission result:', result);

            if (result.success) {
                // Redirect to thank you page
                router.push(`/select/thank-you?event=${encodeURIComponent(sessionData.event.name)}`);
            } else {
                throw new Error(result.message || 'Failed to submit selections');
            }
        } catch (error) {
            console.error('Error submitting selections:', error);
            alert(`Error submitting selections: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Format time remaining
    const formatTimeRemaining = (milliseconds) => {
        if (!milliseconds || milliseconds <= 0) return '0h 0m';

        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    // Get selection button styling
    const getSelectionButtonStyle = (participantId, selectionType, currentSelection) => {
        let isSelected = false;

        if (selectionType === 'Pass') {
            isSelected = currentSelection === 'Pass';
        } else if (selectionType === 'Friend') {
            isSelected = currentSelection === 'Friend' || currentSelection === 'Match & Friend';
        } else if (selectionType === 'Match') {
            isSelected = currentSelection === 'Match' || currentSelection === 'Match & Friend';
        }

        const baseStyle = 'px-4 py-2 rounded-md text-sm font-medium transition-colors border-2 flex items-center gap-2 min-w-[100px] justify-center';

        if (selectionType === 'Pass') {
            return `${baseStyle} ${isSelected
                ? 'bg-red-100 border-red-500 text-red-700'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-300'}`;
        } else if (selectionType === 'Friend') {
            return `${baseStyle} ${isSelected
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-300'}`;
        } else if (selectionType === 'Match') {
            return `${baseStyle} ${isSelected
                ? 'bg-green-100 border-green-500 text-green-700'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-green-50 hover:border-green-300'}`;
        }
    };

    // Check if all selections are complete
    const allSelectionsComplete = Object.values(selections).every(s => s !== null);
    const completedCount = Object.values(selections).filter(s => s !== null).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your selections...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Selection Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    {error.includes('expired') && (
                        <p className="text-sm text-gray-500">
                            Results will be sent to your email once all participants have made their selections.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (!sessionData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Session Not Found</h2>
                    <p className="mt-2 text-gray-600">Invalid selection link.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900">Make Your Selections</h1>
                            <p className="mt-2 text-gray-600">{sessionData.event.name}</p>
                            <p className="text-sm text-gray-500">
                                {sessionData.event.venue} • {new Date(sessionData.event.date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Instructions and Timer */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <User className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="font-medium text-gray-900">
                                Welcome! Please make your selections below.
                            </span>
                        </div>
                        <div className="flex items-center text-orange-600">
                            <Clock className="w-5 h-5 mr-2" />
                            <span className="font-semibold">{formatTimeRemaining(timeRemaining)} remaining</span>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                        <p><strong>Instructions:</strong> Please make a selection for each person you met at the event.</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Pass:</strong> Not interested in further contact</li>
                            <li><strong>Friend:</strong> Would like to connect as friends</li>
                            <li><strong>Match:</strong> Interested in a romantic connection</li>
                            <li><strong>Friend + Match:</strong> Open to both friendship and romance</li>
                        </ul>
                        <p className="text-blue-600 font-medium">
                            {`Your choices are private. Results will be shared only when there's mutual interest.`}
                        </p>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                            Progress: {completedCount}/{selectableParticipants.length} completed
                        </span>
                        <div className="flex items-center">
                            {allSelectionsComplete && <CheckCircle className="w-5 h-5 text-green-600 mr-2" />}
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(completedCount / selectableParticipants.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Participants List */}
                <div className="space-y-6">
                    {selectableParticipants.map((participant) => (
                        <div key={participant.participant_id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                                        <User className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{participant.name}</h3>
                                        <p className="text-sm text-gray-500">{participant.gender}, {participant.age} years old</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleSelection(participant.participant_id, 'Pass')}
                                        className={getSelectionButtonStyle(participant.participant_id, 'Pass', selections[participant.participant_id])}
                                    >
                                        <X className="w-4 h-4" />
                                        Pass
                                    </button>

                                    <button
                                        onClick={() => handleSelection(participant.participant_id, 'Friend')}
                                        className={getSelectionButtonStyle(participant.participant_id, 'Friend', selections[participant.participant_id])}
                                    >
                                        <Users className="w-4 h-4" />
                                        Friend
                                    </button>

                                    <button
                                        onClick={() => handleSelection(participant.participant_id, 'Match')}
                                        className={getSelectionButtonStyle(participant.participant_id, 'Match', selections[participant.participant_id])}
                                    >
                                        <Heart className="w-4 h-4" />
                                        Match
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={submitSelections}
                        disabled={!allSelectionsComplete || submitting}
                        className="px-8 py-3 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Submitting...' : 'Submit My Selections'}
                    </button>

                    {!allSelectionsComplete && (
                        <p className="mt-2 text-sm text-gray-500">
                            Please make selections for all participants before submitting
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParticipantSelection;