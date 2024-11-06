export function addHoursToUtcTime(
  originalTime: string,
  hoursToAdd: number,
): string {
  const date = new Date(originalTime);
  date.setUTCHours(date.getUTCHours() + hoursToAdd);
  return date.toISOString();
}

// Function to get desired image dimensions based on model name
export function getDesiredSize(modelName: string): string {
  const sizes = {
    'SmartTAG HDL Red': '296x128',
    'SmartTAG HD110': '400x300',
    'SmartTAG HD200L Red_1': '800x480',
    'SmartTAG HD200L Red_2': '800x480',
    'SmartTAG HD300 Red_1': '984x1304',
    'SmartTAG HD300 Red_2': '984x1304',

    default: '800x480',
  };
  return sizes[modelName] || sizes.default;
}

export function getMatchingLabels(codcod: any, pricer: any, logger: any) {
  // Extract and sanitize itemSet from `Codcod` data
  let itemSet: Set<string>;
  if (codcod.Items) {
    // Create a set of item barcodes from Codcod
    itemSet = new Set(
      codcod.Items.map((item: { barcode: string }) =>
        item.barcode.replace(/^1?/, ''),
      ),
    );
  } else if (codcod.promos) {
    // Create a set of promo numbers from Codcod, removing prefixed '1'
    itemSet = new Set(
      codcod.promos.map((promo: { promonum: string }) =>
        promo.promonum.replace(/^1/, ''),
      ),
    );
  } else {
    logger.warn('No items or promos found in Codcod data');
    return [];
  }

  // Match `Pricer` data by normalizing IDs (removing any prefixes like 'I' or 'P')
  const matchingLabels = pricer.filter((label: { links: any[] }) =>
    label.links.some((link: { itemId: string }) =>
      itemSet.has(link.itemId.replace(/^[IP]/, '')),
    ),
  );

  // Map the matched labels to desired format
  const result = matchingLabels.map(
    (label: { links: { itemId: string }[]; modelName: any }) => ({
      itemId: label.links[0].itemId, // Keep the existing itemId with its original prefix here
      modelName: label.modelName,
    }),
  );

  return result;
}

export const countryCodeMap = {
  ישראל: 'IL',
  איטליה: 'IT',
  אנגליה: 'EN',
  בריטניה: 'GB',
  גרמניה: 'DE',
  דנמרק: 'DK',
  'דרום אפריקה': 'ZA',
  הולנד: 'NL',
  טורקיה: 'TR',
  ליטא: 'LT',
  'ניו זילנד': 'NZ',
  סין: 'CN',
  ספרד: 'ES',
  צרפת: 'FR',
  שוויץ: 'CH',
  ארגנטינה: 'AR',
  'ארצות הברית': 'US',
  הודו: 'IN',
  הונגריה: 'HU',
  'הרפובליקה הדומיניקנית': 'DO',
  'חוף השנהב': 'CI',
  יוון: 'GR',
  ירדן: 'JO',
  מולדובה: 'MD',
  'סרי לנקה': 'LK',
  פולין: 'PL',
  פרו: 'PE',
  'צ׳ילה': 'CL',
  'קוסטה ריקה': 'CR',
  קנדה: 'CA',
  קניה: 'KE',
};
