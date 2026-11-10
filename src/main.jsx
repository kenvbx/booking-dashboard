import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, Bell, CalendarDays, ChevronDown, ChevronRight, CircleHelp, Clock3,
  Filter, LayoutDashboard, ListFilter, LogOut, Menu, Plus, Search, Settings2,
  ShieldCheck, Sparkles, Users, X,
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const APP_TIMEZONE = 'Asia/Ho_Chi_Minh';
const APP_TIMEZONE_OFFSET = '+07:00';
const STATUS_OPTIONS = ['All status', 'Confirmed', 'Pending', 'Cancelled', 'Completed', 'Rescheduled'];
const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

async function apiRequest(path, options = {}, token = '') {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstError = data.errors && Object.values(data.errors).flat()[0];
    throw new Error(firstError || data.message || 'The request could not be completed.');
  }
  return data;
}

async function fetchAllAppointments(path, token) {
  const appointments = [];
  let page = 1;
  let lastPage = 1;
  do {
    const response = await apiRequest(`${path}&page=${page}&per_page=100`, {}, token);
    appointments.push(...(response.data || []));
    lastPage = response.meta?.last_page || page;
    page += 1;
  } while (page <= lastPage);
  return appointments;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('helio_token') || '');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('helio_user') || 'null'));
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const [status, setStatus] = useState('All status');
  const [staff, setStaff] = useState('All staff');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(Boolean(token));
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (token) loadWorkspace(token);
  }, [token]);

  async function loadWorkspace(activeToken) {
    setLoading(true);
    setApiError('');
    try {
      const [appointmentsResponse, customersResponse, staffResponse, servicesResponse, metricsResponse] = await Promise.allSettled([
        fetchAllAppointments(`/appointments?from=${weekDays[0].iso}&to=${weekDays[6].iso}`, activeToken),
        apiRequest('/customers?per_page=100', {}, activeToken),
        apiRequest('/staff', {}, activeToken),
        apiRequest('/services?per_page=100', {}, activeToken),
        apiRequest('/dashboard/metrics', {}, activeToken),
      ]);
      if (appointmentsResponse.status === 'rejected') throw appointmentsResponse.reason;
      setBookings((appointmentsResponse.value || []).map((item) => normalizeBooking(item, weekDays)));
      setCustomers(customersResponse.status === 'fulfilled' ? customersResponse.value.data || [] : []);
      setStaffMembers(staffResponse.status === 'fulfilled' ? staffResponse.value.data || [] : []);
      setServices(servicesResponse.status === 'fulfilled' ? servicesResponse.value.data || [] : []);
      setDashboardMetrics(metricsResponse.status === 'fulfilled' ? metricsResponse.value.data : null);
    } catch (error) {
      if (/unauthenticated/i.test(error.message)) handleLogout(false);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setApiError('');
    try {
      const response = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password'), device_name: 'helio-dashboard' }) });
      localStorage.setItem('helio_token', response.access_token);
      localStorage.setItem('helio_user', JSON.stringify(response.user));
      setUser(response.user);
      setToken(response.access_token);
    } catch (error) {
      setApiError(error.message);
      setLoading(false);
    }
  }

  async function handleLogout(callApi = true) {
    if (callApi && token) await apiRequest('/auth/logout', { method: 'POST' }, token).catch(() => {});
    localStorage.removeItem('helio_token');
    localStorage.removeItem('helio_user');
    setToken('');
    setUser(null);
    setBookings([]);
  }

  async function saveBooking(event, existingBooking = null) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = `${form.get('date')}T${form.get('time')}:00${APP_TIMEZONE_OFFSET}`;
    const endDate = new Date(start);
    endDate.setMinutes(endDate.getMinutes() + 45);
    const end = formatApiDateTime(endDate);
    try {
      const payload = {
        customer_id: Number(form.get('customer_id')),
        service_id: form.get('service_id') ? Number(form.get('service_id')) : null,
        staff_profile_id: Number(form.get('staff_profile_id')),
        title: form.get('title'),
        starts_at: start,
        ends_at: end,
        timezone: APP_TIMEZONE,
      };
      if (existingBooking) {
        await apiRequest(`/appointments/${existingBooking.id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
      } else {
        await apiRequest('/appointments', { method: 'POST', body: JSON.stringify({ ...payload, status: 'pending', idempotency_key: `web-${crypto.randomUUID()}` }) }, token);
      }
      await loadWorkspace(token);
      setModalOpen(false);
      setSelectedBooking(null);
      showToast(existingBooking ? 'Appointment updated' : 'Appointment added to the workspace');
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function cancelBooking(reason) {
    if (!selectedBooking) return;
    try {
      await apiRequest(`/appointments/${selectedBooking.id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }, token);
      await loadWorkspace(token);
      setModalOpen(false);
      setSelectedBooking(null);
      showToast('Appointment cancelled');
    } catch (error) {
      setApiError(error.message);
    }
  }

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }

  const filtered = useMemo(() => bookings.filter((booking) =>
    (status === 'All status' || booking.status === status) && (staff === 'All staff' || booking.staff === staff)
  ), [bookings, status, staff]);
  const totalCompleted = bookings.filter((booking) => booking.status === 'Completed').length;
  const metrics = [
    { icon: <CalendarDays size={18} />, label: 'Total bookings', value: dashboardMetrics?.total_bookings ?? bookings.length, change: 'API live', note: 'all records', tone: 'green' },
    { icon: <Clock3 size={18} />, label: 'Upcoming today', value: dashboardMetrics?.upcoming_today ?? bookings.filter((booking) => booking.status !== 'Cancelled').length, change: 'API live', note: 'active today', tone: 'blue' },
    { icon: <Activity size={18} />, label: 'Completion rate', value: `${dashboardMetrics?.completion_rate ?? (bookings.length ? Math.round((totalCompleted / bookings.length) * 1000) / 10 : 0)}%`, change: 'API live', note: 'all records', tone: 'purple' },
    { icon: <Users size={18} />, label: 'New customers', value: dashboardMetrics?.new_customers ?? customers.length, change: 'API live', note: 'this month', tone: 'orange' },
  ];

  if (!token) return <LoginScreen onSubmit={handleLogin} loading={loading} error={apiError} />;

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Sparkles size={16} /></div><span>helio</span><button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <div className="workspace-switch"><div className="workspace-avatar">H</div><div><strong>Helio Studio</strong><span>Workspace</span></div><ChevronDown size={15} /></div>
      <nav aria-label="Main navigation"><p className="nav-label">Workspace</p><a className="nav-item active" href="#overview"><LayoutDashboard size={18} /> Overview</a><a className="nav-item" href="#calendar"><CalendarDays size={18} /> Calendar <span className="nav-count">{bookings.length}</span></a><a className="nav-item" href="#customers"><Users size={18} /> Customers</a><a className="nav-item" href="#services"><ListFilter size={18} /> Services</a><p className="nav-label">Manage</p><a className="nav-item" href="#team"><ShieldCheck size={18} /> Team</a><a className="nav-item" href="#settings"><Settings2 size={18} /> Settings</a></nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17} /></div><div><strong>Need a hand?</strong><span>Visit our help center</span></div><ChevronRight size={15} /></div><div className="profile"><div className="profile-avatar">{initials(user?.name)}</div><div><strong>{user?.name || 'Workspace user'}</strong><span>{user?.role || 'Staff'}</span></div><button className="icon-button" onClick={() => handleLogout()} aria-label="Log out"><LogOut size={15} /></button></div></div>
    </aside>

    <main className="main-content"><header className="topbar"><button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>Overview</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search"><Search size={18} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">{initials(user?.name)}</div></div></header>
      <div className="content-wrap">
        {apiError && <div className="api-error" role="alert"><ShieldCheck size={16} /> {apiError}<button onClick={() => setApiError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
        <section className="welcome-row"><div><p className="eyebrow">LIVE API WORKSPACE <span className="live-dot" /> {user?.role || 'Staff'} session</p><h1>Good morning, {firstName(user?.name)} <span>✦</span></h1><p className="subtitle">Your booking operations are synced with the Laravel API.</p></div><button className="primary-button" onClick={() => { setSelectedBooking(null); setModalOpen(true); }} disabled={loading}><Plus size={18} /> New appointment</button></section>
        <section className="metric-grid" aria-label="Booking metrics">{metrics.map((metric) => <Metric key={metric.label} {...metric} />)}</section>
        <section className="main-grid" id="calendar"><div className="calendar-card card"><div className="section-heading"><div><h2>Booking calendar</h2><p>{loading ? 'Loading appointments from API…' : 'See your team’s availability at a glance.'}</p></div><div className="calendar-actions"><button className="outline-button"><CalendarDays size={16} /> This week <ChevronDown size={14} /></button><button className="icon-button subtle" aria-label="More calendar options"><ListFilter size={18} /></button></div></div>
          <div className="filters"><div className="filter-label"><Filter size={15} /> Filters</div><select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select><select aria-label="Filter by staff" value={staff} onChange={(e) => setStaff(e.target.value)}><option>All staff</option>{staffMembers.map((member) => <option key={member.id}>{member.display_name}</option>)}</select><span className="filter-result">{filtered.length} appointments</span></div>
          <div className="calendar-scroll"><div className="calendar"><div className="time-column"><div className="timezone">GMT+07</div>{times.map((time) => <div className="time" key={time}>{time}</div>)}</div><div className="days-column"><div className="day-heads">{weekDays.slice(0, 7).map((day) => <div className={`day-head ${day.isToday ? 'today' : ''}`} key={day.iso}><span>{day.short}</span><strong>{day.date}</strong></div>)}</div><div className="day-grid">{weekDays.slice(0, 7).map((day) => <div className="day-lane" key={day.iso}>{times.map((time) => <div className="hour-line" key={time} />)}{filtered.filter((booking) => booking.isoDate === day.iso).map((booking) => <BookingCard booking={booking} key={booking.id} onClick={() => { setSelectedBooking(booking); setModalOpen(true); }} />)}</div>)}</div></div></div></div>
          <div className="calendar-footer"><span><i className="legend-dot confirmed" /> Confirmed <i className="legend-dot pending" /> Pending <i className="legend-dot cancelled" /> Cancelled</span><span className="updated"><Activity size={13} /> API synced</span></div></div>
          <aside className="right-rail"><div className="card agenda-card"><div className="section-heading compact"><div><h2>Next up</h2><p>Your closest appointments</p></div><button className="text-button">View all <ChevronRight size={14} /></button></div><div className="agenda-date"><div className="date-square"><strong>{filtered[0]?.day || '—'}</strong><span>UP NEXT</span></div><div><strong>Upcoming agenda</strong><span>{bookings.filter((booking) => booking.status !== 'Cancelled').length} active appointments</span></div></div><div className="agenda-list">{bookings.filter((booking) => booking.status !== 'Cancelled').slice(0, 4).map((booking) => <div className="agenda-item" key={booking.id}><div className="agenda-time">{booking.time}<span>{booking.end}</span></div><div className="agenda-line" /><div className="agenda-details"><strong>{booking.title}</strong><span>{booking.customer} · {booking.staff}</span></div><span className={`status-pill ${booking.status.toLowerCase()}`}>{booking.status}</span></div>)}</div><button className="add-agenda" onClick={() => { setSelectedBooking(null); setModalOpen(true); }}><Plus size={16} /> Add appointment</button></div><div className="card insight-card"><div className="insight-icon"><Sparkles size={18} /></div><div><p className="eyebrow">API STATUS</p><h3>Workspace connected</h3><p>Appointments and directories are loading from your Laravel backend.</p><button className="text-button" onClick={() => loadWorkspace(token)}>Refresh data <ChevronRight size={14} /></button></div></div></aside></section>
      </div></main>
    {toast && <div className="toast"><ShieldCheck size={17} /> {toast}</div>}
    {isModalOpen && <AppointmentModal booking={selectedBooking} customers={customers} services={services} staffMembers={staffMembers} onClose={() => { setModalOpen(false); setSelectedBooking(null); }} onSubmit={(event) => saveBooking(event, selectedBooking)} onCancel={cancelBooking} />}
  </div>;
}

function LoginScreen({ onSubmit, loading, error }) { return <div className="login-shell"><div className="login-card"><div className="brand login-brand"><div className="brand-mark"><Sparkles size={16} /></div><span>helio</span></div><p className="eyebrow">BOOKING OPERATIONS</p><h1>Welcome back</h1><p className="subtitle">Sign in to sync your calendar with the Laravel API.</p>{error && <div className="api-error" role="alert"><ShieldCheck size={16} /> {error}</div>}<form onSubmit={onSubmit} className="login-form"><label>Email<input name="email" type="email" defaultValue="admin@helio.test" autoComplete="email" required /></label><label>Password<input name="password" type="password" defaultValue="password" autoComplete="current-password" required /></label><button className="primary-button" type="submit" disabled={loading}>{loading ? 'Connecting…' : 'Sign in to workspace'}</button></form><p className="login-hint">Demo account: admin@helio.test / password</p></div></div>; }
function AppointmentModal({ booking, customers, services, staffMembers, onClose, onSubmit, onCancel }) {
  const editing = Boolean(booking);
  const [reason, setReason] = useState('');
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><p className="eyebrow">{editing ? 'API UPDATE' : 'API CREATE'}</p><h2 id="modal-title">{editing ? 'Edit appointment' : 'New appointment'}</h2></div><button className="icon-button subtle" onClick={onClose} aria-label="Close"><X size={18} /></button></div><form onSubmit={onSubmit}><label>Appointment title<input name="title" placeholder="e.g. Discovery call" defaultValue={booking?.title || ''} required /></label><label>Customer<select name="customer_id" defaultValue={booking?.customerId || ''} required><option value="">Select a customer</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label><div className="form-row"><label>Staff<select name="staff_profile_id" defaultValue={booking?.staffId || ''} required><option value="">Select staff</option>{staffMembers.map((member) => <option value={member.id} key={member.id}>{member.display_name}</option>)}</select></label><label>Service<select name="service_id" defaultValue={booking?.serviceId || ''}><option value="">No service</option>{services.map((service) => <option value={service.id} key={service.id}>{service.name}</option>)}</select></label></div><div className="form-row"><label>Date<input name="date" type="date" defaultValue={booking?.isoDate || tomorrowDate()} required /></label><label>Start time<input name="time" type="time" defaultValue={booking?.time || '10:00'} required /></label></div>{editing && <label>Cancellation reason (only required when cancelling)<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Customer requested cancellation" /></label>}<div className="conflict-note"><ShieldCheck size={16} /><span>Helio checks for overlapping bookings in the API transaction.</span></div><div className="modal-actions">{editing && <button type="button" className="outline-button danger-button" disabled={!reason.trim()} onClick={() => onCancel(reason.trim())}>Cancel appointment</button>}<button type="button" className="outline-button" onClick={onClose}>Close</button><button className="primary-button" type="submit"><Plus size={17} /> {editing ? 'Save changes' : 'Create appointment'}</button></div></form></div></div>;
}

function Metric({ icon, label, value, change, note, tone }) { return <div className="metric card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small><b className={tone}>{change}</b> {note}</small></div><div className="sparkline"><span /><span /><span /><span /><span /><span /><span /></div></div>; }
function BookingCard({ booking, onClick }) { const top = ((parseInt(booking.time, 10) - 8) * 60 + parseInt(booking.time.slice(3), 10)) / 60 * 62; const height = booking.duration >= 60 ? 62 : 53; return <button className={`booking ${booking.staffColor}`} style={{ top: `${top}px`, height: `${height}px` }} aria-label={`${booking.title} with ${booking.customer}`} onClick={onClick}><strong>{booking.title}</strong><span>{booking.time} · {booking.customer}</span><i className={`booking-status ${booking.status.toLowerCase()}`} /></button>; }
function normalizeBooking(item, visibleWeek) {
  const start = new Date(item.starts_at);
  const end = new Date(item.ends_at);
  const isoDate = formatDateInTimezone(start);
  return { id: item.id, customerId: item.customer?.id, serviceId: item.service?.id, staffId: item.staff?.id, isoDate, time: start.toLocaleTimeString([], { timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }), end: end.toLocaleTimeString([], { timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }), title: item.title, customer: item.customer?.name || 'Customer', staff: item.staff?.display_name || 'Unassigned', staffColor: item.staff?.color || 'blue', status: titleCase(item.status), day: visibleWeek.findIndex((day) => day.iso === isoDate) + 1, duration: Math.max(30, (end - start) / 60000) };
}

function titleCase(value) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''; }
function initials(name = 'User') { return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
function firstName(name = 'there') { return name.split(' ')[0]; }
function tomorrowDate() {
  const today = datePartsInTimezone(new Date());
  const date = new Date(Date.UTC(today.year, today.month - 1, today.day + 1));
  return date.toISOString().slice(0, 10);
}

createRoot(document.getElementById('root')).render(<App />);

function formatApiDateTime(value) {
  const parts = datePartsInTimezone(value);
  const date = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  const time = value.toLocaleTimeString([], { timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date}T${time}:00${APP_TIMEZONE_OFFSET}`;
}
function getCurrentWeekDays() {
  const today = datePartsInTimezone(new Date());
  const date = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return Array.from({ length: 8 }, (_, index) => {
    const current = new Date(date);
    current.setUTCDate(date.getUTCDate() + index);
    const iso = current.toISOString().slice(0, 10);
    return { iso, date: String(current.getUTCDate()).padStart(2, '0'), short: new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(current).toUpperCase(), isToday: iso === `${today.year}-${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}` };
  });
}
function datePartsInTimezone(value) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: APP_TIMEZONE, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(value).filter(({ type }) => type !== 'literal').map(({ type, value: part }) => [type, Number(part)]));
}
function formatDateInTimezone(value) {
  const parts = datePartsInTimezone(value);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}
