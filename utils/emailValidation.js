// utils/emailValidation.js - Frontend email validation utility

/**
 * Validates email domain and catches common typos (frontend version)
 * @param {string} email - Email address to validate
 * @returns {Object} Validation result with suggestions if needed
 */
export const validateEmailDomain = (email) => {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }

    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain) {
        return { valid: false, error: 'Invalid email format' };
    }

    // Common domain typos and their corrections
    const typoCorrections = {
        'gmai.com': 'gmail.com',
        'gmal.com': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gmil.com': 'gmail.com',
        'gmaail.com': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        'yahool.com': 'yahoo.com',
        'hotmial.com': 'hotmail.com',
        'hotmailcom': 'hotmail.com',
        'outlok.com': 'outlook.com',
        'outook.com': 'outlook.com',
        'outlook.co': 'outlook.com',
        'aoll.com': 'aol.com',
        'ail.com': 'aol.com',
        'iclou.com': 'icloud.com',
        'icloud.co': 'icloud.com'
    };

    // Check for exact typo matches
    if (typoCorrections[domain]) {
        const correctedEmail = email.replace(`@${domain}`, `@${typoCorrections[domain]}`);
        return {
            valid: false,
            error: `Did you mean "${correctedEmail}"?`,
            suggestion: correctedEmail,
            type: 'typo'
        };
    }

    // Check for suspicious patterns
    if (domain.length < 4 || !domain.includes('.')) {
        return {
            valid: false,
            error: 'Email domain appears to be incomplete',
            type: 'invalid'
        };
    }

    // Check for double dots or other obvious errors
    if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
        return {
            valid: false,
            error: 'Email domain contains invalid characters',
            type: 'invalid'
        };
    }

    return { valid: true };
};

// React component for email input with validation
import React, { useState, useEffect } from 'react';

export const EmailInput = ({
    value = '',
    onChange,
    onValidation,
    placeholder = "Enter email address",
    className = "",
    required = false,
    autoCorrect = true
}) => {
    const [email, setEmail] = useState(value);
    const [validation, setValidation] = useState({ valid: true });
    const [showSuggestion, setShowSuggestion] = useState(false);

    useEffect(() => {
        setEmail(value);
    }, [value]);

    const handleEmailChange = (e) => {
        const newEmail = e.target.value;
        setEmail(newEmail);

        // Real-time validation
        const result = validateEmailDomain(newEmail);
        setValidation(result);
        setShowSuggestion(result.type === 'typo');

        // Call parent onChange
        if (onChange) onChange(newEmail);
        if (onValidation) onValidation(result);
    };

    const applySuggestion = () => {
        if (validation.suggestion) {
            setEmail(validation.suggestion);
            setValidation({ valid: true });
            setShowSuggestion(false);

            if (onChange) onChange(validation.suggestion);
            if (onValidation) onValidation({ valid: true });
        }
    };

    return (
        <div className="space-y-2">
            <div className="relative">
                <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder={placeholder}
                    required={required}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!validation.valid
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                        } ${className}`}
                />

                {!validation.valid && validation.type === 'typo' && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <button
                            type="button"
                            onClick={applySuggestion}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            title="Click to use suggested correction"
                        >
                            Fix
                        </button>
                    </div>
                )}
            </div>

            {/* Validation Message */}
            {!validation.valid && (
                <div className={`text-sm flex items-center space-x-2 ${validation.type === 'typo' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                    <span>{validation.type === 'typo' ? '⚠️' : '❌'}</span>
                    <span>{validation.error}</span>
                    {validation.suggestion && autoCorrect && (
                        <button
                            type="button"
                            onClick={applySuggestion}
                            className="underline font-medium hover:no-underline"
                        >
                            Use this instead
                        </button>
                    )}
                </div>
            )}

            {validation.valid && email && (
                <div className="text-sm text-green-600 flex items-center space-x-1">
                    <span>✅</span>
                    <span>Email looks good!</span>
                </div>
            )}
        </div>
    );
};