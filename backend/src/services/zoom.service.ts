import prisma from '../config/database';

const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

async function getZoomSettings(): Promise<{ clientId: string; clientSecret: string; accountId: string } | null> {
  const settings = await prisma.platformSetting.findMany({
    where: {
      key: { in: ['zoom_client_id', 'zoom_client_secret', 'zoom_account_id'] },
    },
  });
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  const clientId = map.zoom_client_id?.trim();
  const clientSecret = map.zoom_client_secret?.trim();
  const accountId = map.zoom_account_id?.trim();
  if (!clientId || !clientSecret || !accountId) return null;
  return { clientId, clientSecret, accountId };
}

async function getAccessToken(): Promise<string | null> {
  const creds = await getZoomSettings();
  if (!creds) return null;

  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
  const params = new URLSearchParams({
    grant_type: 'account_credentials',
    account_id: creds.accountId,
  });

  const res = await fetch(ZOOM_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[Zoom] Token error:', res.status, err);
    return null;
  }

  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

export interface CreateMeetingInput {
  topic: string;
  startTime: Date;
  durationMinutes?: number;
  timezone?: string;
}

export interface CreateMeetingResult {
  joinUrl: string;
  meetingId: string;
  startUrl?: string;
}

export async function createZoomMeeting(input: CreateMeetingInput): Promise<CreateMeetingResult | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const startTime = input.startTime.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const body = {
    topic: input.topic,
    type: 2, // scheduled meeting
    start_time: startTime,
    duration: input.durationMinutes ?? 60,
    timezone: input.timezone ?? 'Africa/Cairo',
    settings: {
      join_before_host: true,
      waiting_room: false,
    },
  };

  const res = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[Zoom] Create meeting error:', res.status, err);
    return null;
  }

  const json = (await res.json()) as { join_url?: string; id?: string; start_url?: string };
  const joinUrl = json.join_url;
  const meetingId = String(json.id ?? '');
  if (!joinUrl) return null;

  return { joinUrl, meetingId, startUrl: json.start_url };
}

export async function isZoomConfigured(): Promise<boolean> {
  const creds = await getZoomSettings();
  return !!(creds?.clientId && creds?.clientSecret && creds?.accountId);
}
