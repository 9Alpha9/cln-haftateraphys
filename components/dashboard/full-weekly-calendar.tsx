'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, User, CheckCircle2, UserRound, ArrowRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SlideDrawer } from '@/components/ui/slide-drawer';
import { cn } from '@/lib/utils';
import type { CalendarAppointment } from '@/server/queries/appointment-calendar';
import Image from 'next/image';
import Link from 'next/link';

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:00
const WEEKDAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// Palette warna soft untuk acara ala Google Calendar
const EVENT_COLORS = [
  { bg: 'bg-[#E3F2FD]', border: 'border-[#90CAF9]', text: 'text-[#0D47A1]', icon: 'text-[#1976D2]' }, // Blue
  { bg: 'bg-[#E8F5E9]', border: 'border-[#A5D6A7]', text: 'text-[#1B5E20]', icon: 'text-[#388E3C]' }, // Green
  { bg: 'bg-[#F3E5F5]', border: 'border-[#CE93D8]', text: 'text-[#4A148C]', icon: 'text-[#7B1FA2]' }, // Purple
  { bg: 'bg-[#FFF3E0]', border: 'border-[#FFCC80]', text: 'text-[#E65100]', icon: 'text-[#F57C00]' }, // Orange
  { bg: 'bg-[#FCE4EC]', border: 'border-[#F48FB1]', text: 'text-[#880E4F]', icon: 'text-[#C2185B]' }, // Pink
  { bg: 'bg-[#E0F2F1]', border: 'border-[#80CBC4]', text: 'text-[#004D40]', icon: 'text-[#00796B]' }, // Teal
];

function getColorForType(type: string) {
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

const typeLabel: Record<string, string> = {
  INITIAL_ASSESSMENT: 'Assessment Awal',
  THERAPY_SESSION: 'Sesi Terapi',
  FOLLOW_UP: 'Tindak Lanjut',
  EVALUATION: 'Evaluasi',
};

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function FullWeeklyCalendar({
  appointments,
}: {
  appointments: CalendarAppointment[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppt, setSelectedAppt] = useState<CalendarAppointment | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const weekStart = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
  
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dayName: WEEKDAYS[i],
        dateNum: date.getDate(),
        isToday: formatDateKey(date) === formatDateKey(new Date()),
        key: formatDateKey(date),
      };
    });
  }, [weekStart]);

  function prevWeek() {
    setCurrentDate((prev) => addDays(prev, -7));
  }
  function nextWeek() {
    setCurrentDate((prev) => addDays(prev, 7));
  }
  function goToday() {
    setCurrentDate(new Date());
  }

  // Filter appointments for this week only
  const weekEnd = addDays(weekStart, 6);
  const weekKeyStart = formatDateKey(weekStart);
  const weekKeyEnd = formatDateKey(weekEnd);
  
  const weeklyAppointments = appointments.filter(app => {
    const appDate = app.scheduledDate.slice(0, 10);
    return appDate >= weekKeyStart && appDate <= weekKeyEnd;
  });

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  return (
    <>
      <div className="flex flex-col flex-1 min-h-[520px] bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-hafta-ylw-50 text-hafta-ylw-700 shrink-0">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#111827] truncate">Jadwal Terapi</h2>
              <p className="text-xs sm:text-sm font-medium text-[#6B7280] truncate">
                {weekStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={goToday} className="h-8 sm:h-9 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold rounded-xl">
              Hari Ini
            </Button>
            <div className="flex sm:hidden items-center gap-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
              <Button variant="ghost" size="icon" className={cn('h-7 w-7 rounded-lg text-[11px]', viewMode==='day' && 'bg-white shadow-sm')} onClick={()=>setViewMode('day')}>1H</Button>
              <Button variant="ghost" size="icon" className={cn('h-7 w-7 rounded-lg text-[11px]', viewMode==='week' && 'bg-white shadow-sm')} onClick={()=>setViewMode('week')}>7H</Button>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Days Header — sticks with horizontal scroll */}
          <div className="flex shrink-0 border-b border-[#E5E7EB] bg-white">
            <div className="w-12 sm:w-16 shrink-0 bg-white border-r border-[#E5E7EB] sm:border-r-0" />
            <div className="flex flex-1 min-w-[320px] sm:min-w-[520px] overflow-hidden">
              {(viewMode === 'day' ? weekDays.filter(d=>formatDateKey(d.date)===formatDateKey(currentDate)) : weekDays).map((day) => (
                <div key={day.key} className="flex-1 min-w-[72px] flex flex-col items-center justify-center h-14 border-r border-[#E5E7EB] last:border-r-0 bg-white">
                  <span className={cn('text-[10px] font-bold uppercase tracking-wider mb-1', day.dayName === 'Minggu' ? 'text-hafta-red-500' : 'text-[#9CA3AF]')}>
                    <span className="hidden sm:inline">{day.dayName}</span>
                    <span className="sm:hidden">{day.dayName.slice(0,3)}</span>
                  </span>
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold',
                      day.isToday ? 'bg-hafta-ylw-200 text-hafta-ylw-900 shadow-sm' : 'text-[#111827]',
                      !day.isToday && day.dayName === 'Minggu' && 'text-hafta-red-600'
                    )}
                  >
                    {day.dateNum}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable Main Grid */}
          <div className="flex flex-1 min-h-0 overflow-y-auto overflow-x-auto relative">
            {/* Time Sidebar — sticky left */}
            <div className="w-12 sm:w-16 flex-none bg-white relative z-10 shrink-0 sticky left-0">
              <div className="h-[26px] shrink-0 border-b border-[#E5E7EB]/0" />
              {HOURS.map((hour) => (
                <div key={hour} className="h-14 sm:h-20 relative shrink-0">
                  <span className="absolute top-0 right-1 sm:right-2 -translate-y-1/2 text-[9px] sm:text-[10px] font-semibold text-[#9CA3AF] leading-none">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

          {/* Grid */}
          <div className="flex-1 relative min-w-[320px] sm:min-w-[520px] min-h-[600px]">
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              <div className="h-[26px] shrink-0 flex border-b border-[#E5E7EB]">
                {(viewMode === 'day' ? weekDays.filter(d=>formatDateKey(d.date)===formatDateKey(currentDate)) : weekDays).map((day) => (
                  <div key={day.key} className="flex-1 border-r border-[#E5E7EB] last:border-r-0" />
                ))}
              </div>
              {HOURS.map((hour) => (
                <div key={hour} className="h-14 sm:h-20 shrink-0 flex border-b border-[#E5E7EB]/60">
                  {(viewMode === 'day' ? weekDays.filter(d=>formatDateKey(d.date)===formatDateKey(currentDate)) : weekDays).map((day) => (
                    <div key={day.key} className="flex-1 border-r border-[#E5E7EB]/60 last:border-r-0" />
                  ))}
                </div>
              ))}
              <div className="flex-1 min-h-[20px] flex border-b border-[#E5E7EB]/60">
                {(viewMode === 'day' ? weekDays.filter(d=>formatDateKey(d.date)===formatDateKey(currentDate)) : weekDays).map((day) => (
                  <div key={day.key} className="flex-1 border-r border-[#E5E7EB]/60 last:border-r-0" />
                ))}
              </div>
            </div>

            {/* Current time indicator */}
            {(() => {
              const visibleDays = viewMode === 'day' ? weekDays.filter(d=>formatDateKey(d.date)===formatDateKey(currentDate)) : weekDays;
              const todayKey = formatDateKey(now);
              const todayIndex = visibleDays.findIndex((d) => d.key === todayKey);
              if (todayIndex === -1) return null;
              const hours = now.getHours();
              const minutes = now.getMinutes();
              const total = visibleDays.length;
              const top = 26 + (hours + minutes / 60) * (viewMode==='day'? 56 : 80);
              return (
                <div
                  className="absolute pointer-events-none z-10 flex items-center"
                  style={{
                    left: `${(todayIndex / total) * 100}%`,
                    width: `${100 / total}%`,
                    top: `${top}px`,
                  }}
                >
                  <div className="h-2 w-2 rounded-full bg-hafta-red-500 shrink-0 -ml-1" />
                  <div className="h-[2px] flex-1 bg-hafta-red-500 -ml-0.5" />
                </div>
              );
            })()}

            {/* Events layer — 24h scale */}
            {weeklyAppointments
              .filter(app => {
                if (viewMode==='day') return formatDateKey(new Date(app.scheduledDate))===formatDateKey(currentDate);
                return true;
              })
              .map((app) => {
              const appDate = new Date(app.scheduledDate);
              const visibleDays = viewMode === 'day' ? weekDays.filter(d=>formatDateKey(d.date)===formatDateKey(currentDate)) : weekDays;
              const dayIndex = visibleDays.findIndex((d) => d.key === formatDateKey(appDate));
              if (dayIndex === -1) return null;

              const [hours, minutes] = app.startTime.split(':').map(Number);
              const rowH = viewMode==='day' ? 56 : 80;
              const topOffset = 26 + (hours + minutes / 60) * rowH;
              const heightOffset = (app.durationMinutes / 60) * rowH;
              const color = getColorForType(app.type);
              const total = visibleDays.length;

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppt(app)}
                  className="absolute p-0.5 transition-all hover:scale-[1.01] hover:z-20 cursor-pointer"
                  style={{
                    left: `${(dayIndex / total) * 100}%`,
                    width: `${100 / total}%`,
                    top: `${topOffset}px`,
                    height: `${Math.max(heightOffset, 22)}px`,
                  }}
                >
                  <div className={cn('h-full w-full rounded-md border-l-4 p-1 sm:p-1.5 shadow-sm overflow-hidden flex flex-col relative', color.bg, color.border)}>
                    <p className={cn('text-[10px] sm:text-[11px] font-bold leading-tight truncate', color.text)}>
                      {app.patientName}
                    </p>
                    <p className={cn('text-[8px] sm:text-[9px] font-semibold mt-0.5 truncate flex items-center gap-1', color.text, 'opacity-90')}>
                      <Clock className="h-2.5 w-2.5 shrink-0" />
                      {app.startTime} · {app.durationMinutes}m
                    </p>
                    {heightOffset > 60 && (
                      <p className={cn('hidden sm:block text-[9px] font-medium mt-1 truncate', color.text, 'opacity-75')}>
                        {typeLabel[app.type] ?? app.type}
                      </p>
                    )}

                    {app.status === 'COMPLETED' && (
                      <CheckCircle2 className={cn('absolute right-1 bottom-1 h-3 w-3 sm:h-3.5 sm:w-3.5', color.icon)} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      <SlideDrawer
        open={!!selectedAppt}
        onClose={() => setSelectedAppt(null)}
        title={
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              selectedAppt ? getColorForType(selectedAppt.type).bg : 'bg-gray-100',
              selectedAppt ? getColorForType(selectedAppt.type).icon : 'text-gray-500'
            )}>
              <CalendarDays className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#111827]">Detail Sesi Terapi</p>
              <p className="text-[11px] font-semibold text-[#6B7280]">Informasi Janji Temu</p>
            </div>
          </div>
        }
      >
        {selectedAppt && (
          <div className="p-5 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white border border-[#E5E7EB] text-[#64748B]">
                {selectedAppt.therapistImage ? (
                  <Image
                    src={selectedAppt.therapistImage}
                    alt={selectedAppt.therapistName ?? 'Terapis'}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <UserRound className="h-6 w-6" strokeWidth={2} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#111827] truncate">{selectedAppt.patientName}</p>
                <p className="text-[12px] text-[#6B7280] truncate">Dengan {selectedAppt.therapistName ?? 'Terapis Hafta'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#9CA3AF]" strokeWidth={2} />
                <div>
                  <p className="text-[12px] font-bold text-[#111827]">
                    {new Date(selectedAppt.scheduledDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">
                    Jam {selectedAppt.startTime} • Durasi {selectedAppt.durationMinutes} menit
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[#9CA3AF]" strokeWidth={2} />
                <div>
                  <p className="text-[12px] font-bold text-[#111827]">Klinik Hafta Fisioterapi</p>
                  <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Sesi Tatap Muka</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-[#9CA3AF]" strokeWidth={2} />
                <div>
                  <p className="text-[12px] font-bold text-[#111827]">{typeLabel[selectedAppt.type] ?? selectedAppt.type}</p>
                  <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Tipe Penanganan</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB]">
              <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Status Jadwal</p>
              <div className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold',
                selectedAppt.status === 'COMPLETED' ? 'bg-hafta-grn-50 text-hafta-grn-700' :
                selectedAppt.status === 'CANCELLED' ? 'bg-hafta-red-50 text-hafta-red-700' :
                'bg-hafta-ylw-50 text-hafta-ylw-800'
              )}>
                {selectedAppt.status === 'COMPLETED' && <CheckCircle2 className="h-4 w-4" />}
                {selectedAppt.status.replaceAll('_', ' ')}
              </div>
            </div>

            <div className="pt-6">
              <Link
                href={`/dashboard/appointments/${selectedAppt.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-hafta-ylw-200 px-4 py-2.5 text-[13px] font-bold text-hafta-ylw-900 transition-colors hover:bg-hafta-ylw-300"
              >
                Lihat Manajemen Sesi <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </SlideDrawer>
    </>
  );
}