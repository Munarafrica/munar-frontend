export const getCurrentEventId = () => {
  if (typeof window === 'undefined') return 'evt-1';
  return window.localStorage.getItem('munar_current_event_id') || 'evt-1';
};

export const setCurrentEventId = (eventId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('munar_current_event_id', eventId);
};

type EventPayloadStore = Record<string, Record<string, unknown>>;

const STORAGE_KEY = 'munar_event_payloads';

const loadStore = (): EventPayloadStore => {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as EventPayloadStore;
  } catch {
    return {};
  }
};

const saveStore = (store: EventPayloadStore) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const getEventPayload = <T>(eventId: string, key: string, fallback: T): T => {
  const store = loadStore();
  const eventData = store[eventId] || {};
  return (eventData[key] as T) ?? fallback;
};

export const setEventPayload = <T>(eventId: string, key: string, value: T) => {
  const store = loadStore();
  const eventData = store[eventId] || {};
  store[eventId] = { ...eventData, [key]: value };
  saveStore(store);
};
