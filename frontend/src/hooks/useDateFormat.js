import { useState, useEffect } from 'react';

export const useDateFormat = () => {
    const [dateFormat, setDateFormat] = useState('dd-MM-yyyy'); // Default fallback
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDateFormat = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';
                const response = await fetch(`${API_URL}/api/dateformat`);
                const result = await response.json();

                // Handle camelCase (default) or PascalCase
                if ((result.success || result.Success) && (result.data || result.Data || result.dateFormats || result.DateFormats)) {
                    const data = result.data || result.Data || result.dateFormats || result.DateFormats;
                    if (data && data.length > 0) {
                        setDateFormat(data[0].dateformat || data[0].Dateformat);
                    }
                }
            } catch (error) {
                console.error("Error fetching date format:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDateFormat();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '';

        // 1. Robust Parsing
        let date = new Date(dateString);

        // If standard parsing fails or it looks like our custom DB format "dd-MM-yyyy HH:mm:ss"
        // Try to manually parse common non-standard formats found in this app
        if (isNaN(date.getTime()) || (typeof dateString === 'string' && dateString.match(/^\d{2}-\d{2}-\d{4}/))) {
            if (typeof dateString === 'string') {
                // Clean up potential time part for parsing logic if needed, or split smart
                const parts = dateString.split(/[- :T]/);
                // Expecting at least dd, MM, yyyy (3 parts)
                if (parts.length >= 3) {
                    const d = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10) - 1; // Month 0-11
                    const y = parseInt(parts[2], 10);

                    // Basic validation to check if it parses as logical date
                    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                        date = new Date(y, m, d);
                        // If there was time, we could add it, but we usually just want the date object for formatting
                        if (parts.length >= 6) {
                            date.setHours(parseInt(parts[3] || 0), parseInt(parts[4] || 0), parseInt(parts[5] || 0));
                        }
                    }
                }
            }
        }

        if (isNaN(date.getTime())) return dateString; // Return original if still invalid

        // 2. Formatting using "dateFormat" pattern from DB
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const shortYear = String(year).slice(-2);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthName = monthNames[date.getMonth()];

        let formatted = dateFormat; // e.g. "dd-MMM-YY"

        // Replace tokens (Largest/Most specific first to avoid partial matches)
        // yyyy must be before yy
        // MMM must be before MM
        formatted = formatted.replace(/yyyy/g, year);
        formatted = formatted.replace(/MMM/g, monthName);
        formatted = formatted.replace(/MM/g, month);
        formatted = formatted.replace(/dd/g, day);
        formatted = formatted.replace(/YY/g, shortYear);
        formatted = formatted.replace(/yy/g, shortYear);

        return formatted;
    };

    return { dateFormat, formatDate, loading };
};
