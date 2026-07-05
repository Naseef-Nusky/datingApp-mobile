/** Display zodiac on profile — API should enrich, this is a client fallback. */
export function getDisplayZodiac(lifestyle) {
  if (!lifestyle || typeof lifestyle !== 'object') return null;
  if (lifestyle.zodiac) return lifestyle.zodiac;

  const birth =
    lifestyle.birthDate ||
    lifestyle.dateOfBirth ||
    lifestyle.dob ||
    lifestyle.birthday;
  if (!birth) return null;

  const raw = String(birth).trim();
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!iso) return null;

  const month = parseInt(iso[2], 10);
  const day = parseInt(iso[3], 10);
  if (!month || !day) return null;

  const boundaries = [
    { sign: 'Capricorn', start: [12, 22], end: [1, 19] },
    { sign: 'Aquarius', start: [1, 20], end: [2, 18] },
    { sign: 'Pisces', start: [2, 19], end: [3, 20] },
    { sign: 'Aries', start: [3, 21], end: [4, 19] },
    { sign: 'Taurus', start: [4, 20], end: [5, 20] },
    { sign: 'Gemini', start: [5, 21], end: [6, 20] },
    { sign: 'Cancer', start: [6, 21], end: [7, 22] },
    { sign: 'Leo', start: [7, 23], end: [8, 22] },
    { sign: 'Virgo', start: [8, 23], end: [9, 22] },
    { sign: 'Libra', start: [9, 23], end: [10, 22] },
    { sign: 'Scorpio', start: [10, 23], end: [11, 21] },
    { sign: 'Sagittarius', start: [11, 22], end: [12, 21] },
  ];

  const inRange = (m, d, sm, sd, em, ed) => {
    if (sm === em) return m === sm && d >= sd && d <= ed;
    if (sm < em) {
      return (m === sm && d >= sd) || (m === em && d <= ed) || (m > sm && m < em);
    }
    return (m === sm && d >= sd) || (m === em && d <= ed) || m > sm || m < em;
  };

  for (const item of boundaries) {
    if (inRange(month, day, item.start[0], item.start[1], item.end[0], item.end[1])) {
      return item.sign;
    }
  }
  return null;
}
