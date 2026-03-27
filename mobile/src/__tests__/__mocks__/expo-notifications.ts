export async function getPermissionsAsync() {
  return { status: 'granted' };
}
export async function requestPermissionsAsync() {
  return { status: 'granted' };
}
export async function getExpoPushTokenAsync() {
  return { data: 'test-token' };
}
export async function scheduleNotificationAsync() {
  return 'notification-id';
}
export async function cancelScheduledNotificationAsync() {}
export function addNotificationResponseReceivedListener() {
  return { remove: jest.fn() };
}
export function setNotificationHandler() {}
