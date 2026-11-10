import { test, expect } from '@playwright/test';

const staff = { id: 7, display_name: 'Alex Morgan', color: 'blue' };
const customer = { id: 11, name: 'Taylor Reed', email: 'taylor@example.test' };
const service = { id: 21, name: 'Consultation', duration_minutes: 45 };

function resource(data) {
  return { data };
}

test('staff can sign in and create an appointment from the dashboard', async ({ page }) => {
  let createdAppointment = null;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\//, '');

    if (path === 'auth/login' && request.method() === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: 'e2e-token', user: { id: 1, name: 'Alex Morgan', email: 'alex@helio.test', role: 'staff' } }) });
    }
    if (path === 'appointments' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: createdAppointment ? [createdAppointment] : [], meta: { current_page: 1, last_page: 1 } }) });
    }
    if (path === 'appointments' && request.method() === 'POST') {
      const payload = JSON.parse(request.postData() || '{}');
      createdAppointment = { id: 101, title: payload.title, status: 'pending', starts_at: payload.starts_at, ends_at: payload.ends_at, customer, service, staff };
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(resource(createdAppointment)) });
    }
    if (path === 'customers') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [customer], meta: { current_page: 1, last_page: 1 } }) });
    if (path === 'services') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [service], meta: { current_page: 1, last_page: 1 } }) });
    if (path === 'staff') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(resource([staff])) });
    if (path === 'dashboard/metrics') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(resource({ total_bookings: 0, upcoming_today: 0, completion_rate: 0, new_customers: 1 })) });

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
  });

  await page.goto('/');
  await page.getByLabel('Email').fill('admin@helio.test');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in to workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Good morning, Alex' })).toBeVisible();

  await page.getByRole('button', { name: 'New appointment' }).click();
  await page.getByLabel('Appointment title').fill('E2E consultation');
  await page.getByLabel('Customer').selectOption(String(customer.id));
  await page.locator('select[name=staff_profile_id]').selectOption(String(staff.id));
  await page.getByLabel('Service').selectOption(String(service.id));
  await page.getByRole('button', { name: 'Create appointment' }).click();

  await expect(page.getByText('Appointment added to the workspace')).toBeVisible();
  await expect(page.getByRole('button', { name: /E2E consultation with Taylor/ })).toBeVisible();
});
