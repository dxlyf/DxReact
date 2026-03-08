import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface CalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  value,
  defaultValue = new Date(),
  onChange,
  className,
  ...props
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(value !== undefined ? value : defaultValue);
  const [currentMonth, setCurrentMonth] = useState<Date>(value !== undefined ? value : defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setCurrentDate(value);
      setCurrentMonth(value);
    }
  }, [value]);

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    onChange?.(date);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // 填充上个月的日期
    for (let i = 0; i < firstDay; i++) {
      const prevMonthDays = getDaysInMonth(year, month - 1);
      const date = new Date(year, month - 1, prevMonthDays - firstDay + i + 1);
      days.push(
        <div key={`prev-${i}`} className="lyf-calendar-day lyf-calendar-day-other">
          {date.getDate()}
        </div>
      );
    }

    // 填充当前月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === currentDate.toDateString();

      days.push(
        <div
          key={`current-${i}`}
          className={classNames('lyf-calendar-day', {
            'lyf-calendar-day-today': isToday,
            'lyf-calendar-day-selected': isSelected,
          })}
          onClick={() => handleDateClick(date)}
        >
          {i}
        </div>
      );
    }

    // 填充下个月的日期
    const totalDays = days.length;
    const remainingDays = 42 - totalDays; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push(
        <div key={`next-${i}`} className="lyf-calendar-day lyf-calendar-day-other">
          {date.getDate()}
        </div>
      );
    }

    return days;
  };

  const calendarClass = classNames('lyf-calendar', className);

  return (
    <div className={calendarClass} {...props}>
      <div className="lyf-calendar-header">
        <button className="lyf-calendar-nav" onClick={handlePrevMonth}>
          ‹
        </button>
        <h3 className="lyf-calendar-title">
          {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
        </h3>
        <button className="lyf-calendar-nav" onClick={handleNextMonth}>
          ›
        </button>
      </div>
      <div className="lyf-calendar-weekdays">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="lyf-calendar-weekday">
            {day}
          </div>
        ))}
      </div>
      <div className="lyf-calendar-days">
        {generateCalendarDays()}
      </div>
    </div>
  );
};

export default Calendar;
