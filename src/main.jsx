import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, Filter, LayoutDashboard, ListFilter, Menu, Plus,
  Search, Settings2, ShieldCheck, Sparkles, Users, X
} from 'lucide-react';
import './styles.css';

const initialBookings = [
  { id: 1, time: '09:00', end: '09:45', title: 'Brand strategy session', customer: 'Maya Singh', staff: 'Alex Morgan', staffColor: 'purple', status: 'Confirmed', day: 1 },
  { id: 2, time: '10:30', end: '11:15', title: 'Website consultation', customer: 'Noah Williams', staff: 'Jamie Lee', staffColor: 'blue', status: 'Pending', day: 1 },
  { id: 3, time: '13:00', end: '14:00', title: 'Product discovery call', customer: 'Lena Ortiz', staff: 'Alex Morgan', staffColor: 'purple', status: 'Confirmed', day: 2 },
  { id: 4, time: '11:30', end: '12:00', title: 'Onboarding check-in', customer: 'Theo Martin', staff: 'Priya Shah', staffColor: 'orange', status: 'Confirmed', day: 3 },
  { id: 5, time: '15:00', end: '15:45', title: 'Growth review', customer: 'Hana Kim', staff: 'Jamie Lee', staffColor: 'blue', status: 'Cancelled', day: 4 },
  { id: 6, time: '09:30', end: '10:15', title: 'UX audit handoff', customer: 'Owen Carter', staff: 'Priya Shah', staffColor: 'orange', status: 'Confirmed', day: 5 },
  { id: 7, time: '14:00', end: '15:00', title: 'Quarterly planning', customer: 'Iris Chen', staff: 'Alex Morgan', staffColor: 'purple', status: 'Pending', day: 5 },
];

const weekDays = [
  { short: 'MON', date: '12', full: 'Monday' }, { short: 'TUE', date: '13', full: 'Tuesday' },
  { short: 'WED', date: '14', full: 'Wednesday' }, { short: 'THU', date: '15', full: 'Thursday' },
  { short: 'FRI', date: '16', full: 'Friday' }, { short: 'SAT', date: '17', full: 'Saturday' },
  { short: 'SUN', date: '18', full: 'Sunday' },
];
const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

function App() {
  const [bookings, setBookings] = useState(initialBookings);
  const [status, setStatus] = useState('All status');
  const [staff, setStaff] = useState('All staff');
  const [isModalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState('');

  const filtered = useMemo(() => bookings.filter((b) =>
    (status === 'All status' || b.status === status) && (staff === 'All staff' || b.staff === staff)
  ), [bookings, status, staff]);

  function addBooking(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newBooking = {
      id: Date.now(), time: form.get('time'), end: '10:45', title: form.get('title') || 'New appointment',
      customer: form.get('customer') || 'New customer', staff: form.get('staff'), staffColor: form.get('staff') === 'Alex Morgan' ? 'purple' : 'blue', status: 'Pending', day: 2
    };
    setBookings((items) => [...items, newBooking]);
    setModalOpen(false);
    setToast('Appointment added to the week');
    window.setTimeout(() => setToast(''), 2600);
  }

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Sparkles size={16} /></div><span>helio</span><button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <div className="workspace-switch"><div className="workspace-avatar">H</div><div><strong>Helio Studio</strong><span>Workspace</span></div><ChevronDown size={15} /></div>
      <nav aria-label="Main navigation">
        <p className="nav-label">Workspace</p>
        <a className="nav-item active" href="#overview"><LayoutDashboard size={18} /> Overview</a>
        <a className="nav-item" href="#calendar"><CalendarDays size={18} /> Calendar <span className="nav-count">7</span></a>
        <a className="nav-item" href="#customers"><Users size={18} /> Customers</a>
        <a className="nav-item" href="#services"><ListFilter size={18} /> Services</a>
        <p className="nav-label">Manage</p>
        <a className="nav-item" href="#team"><ShieldCheck size={18} /> Team</a>
        <a className="nav-item" href="#settings"><Settings2 size={18} /> Settings</a>
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17} /></div><div><strong>Need a hand?</strong><span>Visit our help center</span></div><ChevronRight size={15} /></div><div className="profile"><div className="profile-avatar">TP</div><div><strong>Tuyen Pham</strong><span>Admin</span></div><ChevronDown size={15} /></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>Overview</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search"><Search size={18} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">TP</div></div></header>
      <div className="content-wrap">
        <section className="welcome-row"><div><p className="eyebrow">MONDAY, MAY 12, 2025 <span className="live-dot" /> Live workspace</p><h1>Good morning, Tuyen <span>✦</span></h1><p className="subtitle">Here’s what’s happening across your booking operations today.</p></div><button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={18} /> New appointment</button></section>

        <section className="metric-grid" aria-label="Booking metrics">
          <Metric icon={<CalendarDays size={18} />} label="Total bookings" value="248" change="+12.5%" note="vs last month" tone="green" />
          <Metric icon={<Clock3 size={18} />} label="Upcoming today" value="18" change="+4" note="from yesterday" tone="blue" />
          <Metric icon={<Activity size={18} />} label="Completion rate" value="94.8%" change="+2.4%" note="vs last month" tone="purple" />
          <Metric icon={<Users size={18} />} label="New customers" value="36" change="+18.2%" note="vs last month" tone="orange" />
        </section>

        <section className="main-grid" id="calendar">
          <div className="calendar-card card"><div className="section-heading"><div><h2>Booking calendar</h2><p>See your team’s availability at a glance.</p></div><div className="calendar-actions"><button className="outline-button"><CalendarDays size={16} /> This week <ChevronDown size={14} /></button><button className="icon-button subtle" aria-label="More calendar options"><ListFilter size={18} /></button></div></div>
            <div className="filters"><div className="filter-label"><Filter size={15} /> Filters</div><select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option>All status</option><option>Confirmed</option><option>Pending</option><option>Cancelled</option></select><select aria-label="Filter by staff" value={staff} onChange={(e) => setStaff(e.target.value)}><option>All staff</option><option>Alex Morgan</option><option>Jamie Lee</option><option>Priya Shah</option></select><span className="filter-result">{filtered.length} appointments</span></div>
            <div className="calendar-scroll"><div className="calendar"><div className="time-column"><div className="timezone">GMT+07</div>{times.map((time) => <div className="time" key={time}>{time}</div>)}</div><div className="days-column"><div className="day-heads">{weekDays.map((day, index) => <div className={`day-head ${index === 1 ? 'today' : ''}`} key={day.date}><span>{day.short}</span><strong>{day.date}</strong></div>)}</div><div className="day-grid">{weekDays.map((_, i) => <div className="day-lane" key={i}>{times.map((time) => <div className="hour-line" key={time} />)}{filtered.filter((b) => b.day === i + 1).map((booking) => <BookingCard booking={booking} key={booking.id} />)}</div>)}</div></div></div></div>
            <div className="calendar-footer"><span><i className="legend-dot confirmed" /> Confirmed <i className="legend-dot pending" /> Pending <i className="legend-dot cancelled" /> Cancelled</span><span className="updated"><Activity size={13} /> Updated just now</span></div>
          </div>
          <aside className="right-rail"><div className="card agenda-card"><div className="section-heading compact"><div><h2>Next up</h2><p>Your closest appointments</p></div><button className="text-button">View all <ChevronRight size={14} /></button></div><div className="agenda-date"><div className="date-square"><strong>12</strong><span>MON</span></div><div><strong>Today’s agenda</strong><span>4 appointments scheduled</span></div></div><div className="agenda-list">{bookings.filter(b => b.day === 1 && b.status !== 'Cancelled').map((b) => <div className="agenda-item" key={b.id}><div className="agenda-time">{b.time}<span>{b.end}</span></div><div className="agenda-line" /><div className="agenda-details"><strong>{b.title}</strong><span>{b.customer} · {b.staff}</span></div><span className={`status-pill ${b.status.toLowerCase()}`}>{b.status}</span></div>)}</div><button className="add-agenda" onClick={() => setModalOpen(true)}><Plus size={16} /> Add to today</button></div><div className="card insight-card"><div className="insight-icon"><Sparkles size={18} /></div><div><p className="eyebrow">QUICK INSIGHT</p><h3>Tuesday is your busiest day</h3><p>You have 6 appointments scheduled. Consider opening one more slot.</p><button className="text-button">Review availability <ChevronRight size={14} /></button></div></div></aside>
        </section>
      </div>
    </main>
    {toast && <div className="toast"><ShieldCheck size={17} /> {toast}</div>}
    {isModalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><p className="eyebrow">QUICK CREATE</p><h2 id="modal-title">New appointment</h2></div><button className="icon-button subtle" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} /></button></div><form onSubmit={addBooking}><label>Appointment title<input name="title" placeholder="e.g. Discovery call" required /></label><label>Customer<input name="customer" placeholder="Customer name" required /></label><div className="form-row"><label>Staff<select name="staff"><option>Alex Morgan</option><option>Jamie Lee</option><option>Priya Shah</option></select></label><label>Start time<input name="time" type="time" defaultValue="10:00" required /></label></div><div className="conflict-note"><ShieldCheck size={16} /><span>Helio will check for overlapping bookings before saving.</span></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" type="submit"><Plus size={17} /> Create appointment</button></div></form></div></div>}
  </div>;
}

function Metric({ icon, label, value, change, note, tone }) { return <div className="metric card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small><b className={tone}>{change}</b> {note}</small></div><div className="sparkline"><span /><span /><span /><span /><span /><span /><span /></div></div>; }
function BookingCard({ booking }) { const top = ((parseInt(booking.time, 10) - 8) * 60 + parseInt(booking.time.slice(3), 10)) / 60 * 62; const height = booking.end === '14:00' ? 62 : 53; return <button className={`booking ${booking.staffColor}`} style={{ top: `${top}px`, height: `${height}px` }} aria-label={`${booking.title} with ${booking.customer}`}><strong>{booking.title}</strong><span>{booking.time} · {booking.customer}</span><i className={`booking-status ${booking.status.toLowerCase()}`} /></button>; }

createRoot(document.getElementById('root')).render(<App />);
