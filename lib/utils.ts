import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(ms: number): string {
  if (ms <= 0) return 'Time Expired';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function calculatePercentage(votes: number, total: number): string {
  return total > 0 ? ((votes / total) * 100).toFixed(1) : '0';
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

export function validateMatricNumber(matricNumber: string): boolean {
  // Basic validation - adjust according to your institution's format
  const matricRegex = /^[a-zA-Z0-9]{6,15}$/;
  return matricRegex.test(matricNumber);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}