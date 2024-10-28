export function addHoursToUtcTime(originalTime: string, hoursToAdd: number): string {
    const date = new Date(originalTime);
    date.setUTCHours(date.getUTCHours() + hoursToAdd);
    return date.toISOString();
  }
  
  // Function to get desired image dimensions based on model name
  export function getDesiredSize(modelName: string): {
    desiredWidth: number;
    desiredHeight: number;
  } {
    const sizes = {
      'SmartTAG HDL Red 1328': { desiredWidth: 296, desiredHeight: 128 },
      'SmartTAG HD110': { desiredWidth: 400, desiredHeight: 300 },
      'Image': { desiredWidth: 400, desiredHeight: 300 },
      'SmartTAG HD200L Red': { desiredWidth: 800, desiredHeight: 480 },
      'SmartTAG HD300 Red': { desiredWidth: 1304, desiredHeight: 984 },
      default: { desiredWidth: 768, desiredHeight: 920 },
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