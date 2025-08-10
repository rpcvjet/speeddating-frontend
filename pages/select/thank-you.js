// pages/select/thank-you.js
import React from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Heart, Mail, Clock } from 'lucide-react';

const ThankYouPage = () => {
    const router = useRouter();
    const { event } = router.query;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    {/* Success Icon */}
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>

                    {/* Main Message */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Thank You for Your Selections!
                    </h1>

                    <p className="text-lg text-gray-600 mb-6">
                        Your selections for <strong>{event || 'the event'}</strong> have been submitted successfully.
                    </p>

                    {/* What Happens Next */}
                    <div className="bg-blue-50 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center justify-center">
                            <Clock className="w-5 h-5 mr-2 text-blue-600" />
                            What Happens Next?
                        </h2>

                        <div className="space-y-4 text-left">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                    <span className="text-sm font-bold text-blue-600">1</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Processing Period</h3>
                                    <p className="text-sm text-gray-600">
                                        We'll wait for all participants to submit their selections or until the 24-hour deadline.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                    <span className="text-sm font-bold text-blue-600">2</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Match Processing</h3>
                                    <p className="text-sm text-gray-600">
                                        Our system will process all selections and identify mutual matches based on your preferences.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                    <span className="text-sm font-bold text-blue-600">3</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Results Delivered</h3>
                                    <p className="text-sm text-gray-600">
                                        You'll receive an email with your matches and their contact information within 24-48 hours.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Match Types Reminder */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                            <Heart className="w-5 h-5 mr-2 text-pink-600" />
                            Your Match Types
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-white rounded-lg p-4">
                                <h3 className="font-medium text-green-700 mb-2">💕 Romantic Matches</h3>
                                <p className="text-gray-600">
                                    When you both selected "Match" - you'll receive their phone number and email.
                                </p>
                            </div>

                            <div className="bg-white rounded-lg p-4">
                                <h3 className="font-medium text-blue-700 mb-2">👥 Friend Matches</h3>
                                <p className="text-gray-600">
                                    When you both want to be friends - you'll receive their email address.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-center text-gray-500 mb-4">
                            <Mail className="w-5 h-5 mr-2" />
                            <span className="text-sm">
                                Results will be sent to your registered email address
                            </span>
                        </div>

                        <p className="text-sm text-gray-500">
                            Questions? Contact the event organizer or check your email for updates.
                        </p>
                    </div>

                    {/* Privacy Note */}
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Privacy Note:</strong> Your selections are completely confidential.
                            Only mutual matches will be shared, and no one will know if you selected "Pass" for them.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThankYouPage;