/** 大数缩写：1234 → 1.2K，1500000 → 1.5M */
export function fmtNum(n: number): string {
  const v = Math.floor(n);
  if (v < 1000) return String(v);
  const units = ['K', 'M', 'B', 'T'];
  let u = -1;
  let x = v;
  while (x >= 1000 && u < units.length - 1) {
    x /= 1000;
    u += 1;
  }
  const s = x >= 100 ? String(Math.floor(x)) : x.toFixed(1);
  return `${s}${units[u]}`;
}

/** 秒 → 中文时长：3725 → 1时2分5秒 */
export function fmtDuration(totalS: number): string {
  const s = Math.max(0, Math.floor(totalS));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}天`);
  if (h) parts.push(`${h}时`);
  if (m) parts.push(`${m}分`);
  if (sec || parts.length === 0) parts.push(`${sec}秒`);
  return parts.join('');
}

/** 0.62 → 62% */
export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** 毫秒时间戳 → 本地「MM-DD HH:mm」，用于云同步时间展示 */
export function fmtDateTime(ts: number): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '未知时间';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
