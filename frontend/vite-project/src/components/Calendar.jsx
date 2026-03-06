import { useState } from "react";

export default function Calendar({ activeDays = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Helper: format YYYY-MM-DD to easily check against activeDays
    const formatDate = (y, m, d) => {
        const mm = String(m + 1).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        return `${y}-${mm}-${dd}`;
    };

    // Convert active UTC timestamp array into a Set of local "YYYY-MM-DD" dates
    const localActiveDates = new Set();
    if (Array.isArray(activeDays)) {
        activeDays.forEach(isoString => {
            const dateObj = new Date(isoString); // Automatically parses UTC and converts to Local
            if (!isNaN(dateObj)) {
                localActiveDates.add(formatDate(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
            }
        });
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const days = [];
    // Empty slots for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDate(year, month, d);
        const isStreaked = localActiveDates.has(dateStr);
        const isToday = isCurrentMonth && d === today.getDate();

        let className = "cal-day";
        if (isToday) className += " today";
        if (isStreaked) className += " streaked";

        days.push(
            <div key={`day-${d}`} className={className}>
                {d}
            </div>
        );
    }

    return (
        <div className="sidebar-panel s3">
            <div className="cal-header-row">
                <h3>📅 <span className="month-label">{monthNames[month]} {year}</span></h3>
                <div className="cal-navs">
                    <button onClick={handlePrevMonth}>&lt;</button>
                    <button onClick={handleNextMonth}>&gt;</button>
                </div>
            </div>

            <div className="cal-grid" id="cal">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={`name-${i}`} className="cal-day-name">{d}</div>
                ))}
                {days}
            </div>

            <div className="streak-legend">
                <div className="legend-dot" style={{ background: "linear-gradient(135deg, #ff6b1a, #ff8c42)", width: "12px", height: "12px", borderRadius: "50%" }}></div>
                <span>Quiz Completed</span>
            </div>
        </div>
    );
}