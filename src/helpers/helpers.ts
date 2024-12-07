import * as fs from 'fs';
import * as path from 'path';
import { MyLogger } from 'src/logger';

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

export function getMatchingLabels(
  codcod: { Items?: any[]; promos?: any[] },
  pricer: any,
  logger: any,
) {
  // Extract and sanitize itemSet from `Codcod` data
  let itemSet: Set<string>;
  // Determine if codcod has Items or promos and extract accordingly
  if (codcod.Items && Array.isArray(codcod.Items)) {
    // Create a set of item barcodes from Codcod Items
    itemSet = new Set(
      codcod.Items.map(
        (item: { barcode: string }) => item.barcode, // Remove the replacement logic for prefix '1' as you specified
      ),
    );
  } else if (codcod.promos && Array.isArray(codcod.promos)) {
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

export async function updateItemsAndPromos(
  codcodItems: { Items: any[] },
  codcodPromos: { promos: any[] },
  existingItemIds: Set<string>,
  updateItemFunction: (id: string, dsc: string) => Promise<void>,
  logger: MyLogger,
): Promise<void> {
  const updatePromises: Promise<void>[] = [];

  // Ensure there's an entry for items
  if (codcodItems.Items && codcodItems.Items.length > 0) {
    logger.log(
      `Starting updates for ${codcodItems.Items.length} branch items.`,
    );

    // Update branch items
    for (const item of codcodItems.Items) {
      // logger.log(`Checking item with barcode: ${item.barcode}`);
      if (!existingItemIds.has(item.barcode)) {
        // logger.log(`Preparing to update item with barcode: ${item.barcode}`); // Log item being processed
        updatePromises.push(updateItemFunction(item.barcode, item.dsc));
      }
    }
  } else {
    logger.warn('No branch items to update.');
  }

  // Ensure there's an entry for promos
  if (codcodPromos.promos && codcodPromos.promos.length > 0) {
    logger.log(`Starting updates for ${codcodPromos.promos.length} promos.`);

    // Update promos
    for (const promo of codcodPromos.promos) {
      const prefixedPromoId = `P${promo.promonum}`;
      // logger.log(`Checking promo with ID: ${prefixedPromoId}`);
      if (!existingItemIds.has(prefixedPromoId)) {
        // logger.log(`Preparing to update promo with ID: ${prefixedPromoId}`); // Log promo being processed
        updatePromises.push(updateItemFunction(prefixedPromoId, promo.dsc));
      } else {
        logger.log(
          `Promo with ID: ${prefixedPromoId} already exists, skipping update.`,
        );
      }
    }
  } else {
    logger.warn('No promos to update.');
  }

  // Wait for all updates to complete
  try {
    await Promise.all(updatePromises);
    logger.log(
      `All updates completed. Total updates made: ${updatePromises.length}`,
    );
  } catch (error) {
    logger.error('Error updating items or promos:', error);
  }
}

// Function to read the last update time from the file// Define the path to the `time.json` file
const TIME_FILE_PATH = path.join(__dirname, '../.././time.json');

// Function to read the last update time from the file
export function readLastUpdateTime(logger: MyLogger): string {
  try {
    if (fs.existsSync(TIME_FILE_PATH)) {
      const data = fs.readFileSync(TIME_FILE_PATH, 'utf-8').trim();

      if (data) {
        logger.log(`Successfully read last update time: ${data}`);
        const match = data.match(/"lastUpdateTime": "(.*)"/);
        return match
          ? match[1]
          : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      }

      logger.warn(`File ${TIME_FILE_PATH} is empty.`);
    } else {
      logger.warn(`File ${TIME_FILE_PATH} does not exist.`);
    }
  } catch (error) {
    logger.error(
      `Error reading last update time: ${error.message}`,
      error.stack,
    );
  }

  const defaultTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  logger.log(`Creating file with default time: ${defaultTime}`);
  writeCurrentUpdateTime(defaultTime, logger);
  return defaultTime; // Return the default time
}

// Function to write the current update time to the file
export function writeCurrentUpdateTime(
  currentTime: string,
  logger: MyLogger,
): void {
  const jsonData = JSON.stringify({ lastUpdateTime: currentTime }, null, 2);

  try {
    fs.writeFileSync(TIME_FILE_PATH, jsonData, 'utf-8');
  } catch (error) {
    logger.error(
      `Error writing current update time: ${error.message}`,
      error.stack,
    );
  }
}
