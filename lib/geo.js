const EU_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR',
  'HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK',
  'SI','ES','SE'
]);

export async function lookupCountryFromIp(ip) {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,status`);
    const data = await res.json();
    if (data.status !== 'success' || !data.countryCode) {
      return { countryCode: null, isEU: true }; // fail safe to stricter rule
    }
    return { countryCode: data.countryCode, isEU: EU_COUNTRIES.has(data.countryCode) };
  } catch {
    return { countryCode: null, isEU: true }; // fail safe to stricter rule
  }
}