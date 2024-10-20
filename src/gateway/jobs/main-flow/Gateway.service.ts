import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CodcodService } from 'src/codcod/codcod.service';
import { PricerService } from 'src/pricer/pricer.service';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { MyLogger } from '../../../logger';
import * as fs from 'fs';
import * as path from 'path';

function addHoursToUtcTime(originalTime: string, hoursToAdd: number): string {
  const date = new Date(originalTime);
  date.setUTCHours(date.getUTCHours() + hoursToAdd);
  return date.toISOString();
}

function getDesiredSize(modelName: string): {
  desiredWidth: number;
  desiredHeight: number;
} {
  switch (modelName) {
    case 'SmartTAG HDL Red 1328':
      return { desiredWidth: 296, desiredHeight: 128 };
    case 'SmartTAG HD110':
    case 'Image':
      return { desiredWidth: 400, desiredHeight: 300 };
    case 'SmartTAG HD200L Red':
      return { desiredWidth: 800, desiredHeight: 480 };
    case 'SmartTAG HD300 Red':
      return { desiredWidth: 1304, desiredHeight: 984 };
    default:
      return { desiredWidth: 768, desiredHeight: 920 };
  }
}
export function getMatchingLabels(codcod: any, pricer: any, logger: any) {
  let itemSet: Set<unknown>;
  if (codcod.Items) {
    // Create a set of item barcodes from Codcod
    itemSet = new Set(
      codcod.Items.map((item: { barcode: any }) => item.barcode),
    );
  } else if (codcod.promos) {
    // Create a set of promo numbers from Codcod
    itemSet = new Set(
      codcod.promos.map((promo: { promonum: any }) => promo.promonum),
    );
  } else {
    logger.warn('No items found in Codcod data');
    return [];
  }

  // Filter labels by matching their numeric IDs with Codcod data (ignoring 'I' and 'P' prefixes)
  const matchingLabels = pricer.filter((label: { links: any[] }) =>
    label.links.some((link: { itemId: any }) =>
      itemSet.has(link.itemId.replace(/^[IP]/, '')),
    ),
  );
  const result = matchingLabels.map(
    (label: { links: { itemId: any }[]; modelName: any }) => ({
      itemId: label.links[0].itemId,
      modelName: label.modelName,
    }),
  );
  return result;
}

@Injectable()
export class GatewayService {
  private readonly logger = new MyLogger();
  private readonly storeId: string;

  constructor(
    private readonly codcodService: CodcodService,
    private readonly pricerService: PricerService,
    private readonly configService: ConfigService,
  ) {
    this.storeId = this.configService.get<string>('STORE_ID');
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processUpdates(): Promise<void> {
    const lastUpdateTime = new Date().toISOString();
    const updatedTime = addHoursToUtcTime(lastUpdateTime, 3);

    this.logger.log(`Processing updates since ${updatedTime}`);

    try {
      // Fetch updated items from Codcod
      const codcodItems =
        (await this.codcodService.getAllBranchItems(
          // lastUpdateTime,
          this.storeId,
        )) || [];
      const codcodPromos =
        (await this.codcodService.getAllBranchPromos(
          // lastUpdateTime,
          this.storeId,
        )) || [];

      // Fetch all labels from Pricer
      const allLabels = await this.pricerService.getAllLabelsInStore();

      const filteredItemIds = getMatchingLabels(
        codcodItems,
        allLabels,
        this.logger,
      );
      const filteredPromoIds = getMatchingLabels(
        codcodPromos,
        allLabels,
        this.logger,
      );

      // Ensure proper processing
      this.logger.log(
        'Filtered Items: ' + JSON.stringify(filteredItemIds, null, 2),
      );
      this.logger.log(
        'Filtered Promos: ' + JSON.stringify(filteredPromoIds, null, 2),
      );

      await Promise.all([
        this.processImages(filteredItemIds),
        this.processImages(filteredPromoIds),
      ]);

      this.logger.log('Processing completed.');
    } catch (error) {
      this.logger.error('Error processing updates:', error.stack);
    }
  }

  async processImages(
    itemIds: { itemId: string; modelName: string }[],
  ): Promise<void> {
    for (const { itemId, modelName } of itemIds) {

      const { desiredWidth, desiredHeight } = getDesiredSize(modelName);
      let nameFunction: string;
      let size = '768X960';
      let itemIdWithoutPrefix = itemId; // Start with the original ID

      // Determine the function based on itemId prefix
      if (itemId.startsWith('I')) {
        nameFunction = 'getItemSign';
        itemIdWithoutPrefix = itemId.replace(/^I/, ''); // Remove 'I'

      } else if (itemId.startsWith('P')) {
        nameFunction = 'getPromoSign';
        itemIdWithoutPrefix = '1' + itemId.replace(/^P/, ''); // Remove 'P' and add '1'
      } else {
        nameFunction = 'getSign';
      }

      // Log the current operation
      this.logger.log(
        `Fetching image for itemId: ${itemId} using function: ${nameFunction}`,
      );

      try {
        // Remove prefix 'I' or 'P' before processing
        this.logger.log(
          `Original ID: ${itemId}, Without Prefix: ${itemIdWithoutPrefix}`,
        );

        // Fetch item image from Codcod
        const image = await this.codcodService[nameFunction](
          itemIdWithoutPrefix,
          size,
        );
        if (!image) {
          this.logger.warn(`No image found for itemId: ${itemId}`);
          continue;
        }

        this.logger.log(
          `Image fetched for itemId: ${itemIdWithoutPrefix}. Processing image...`,
        );

        const processedImage = await sharp(image)
          .rotate(90) // Rotate image 90 degrees to the right
          .resize(desiredWidth, desiredHeight, {
            fit: 'fill',
          })
          .toBuffer();

        // Save processed image to the local file system
        const imagePath = path.join(__dirname, 'processed_images'); // Ensure this path exists
        const filePath = path.join(imagePath, `${itemIdWithoutPrefix}.png`);

        // Ensure the directory exists
        fs.mkdirSync(imagePath, { recursive: true });

        // Save the image file
        fs.writeFileSync(filePath, processedImage);
        this.logger.log(
          `Processed image saved for itemId: ${itemIdWithoutPrefix} at ${filePath}`,
        );

        // Log before sending to the update method
        this.logger.log(
          `Sending processed image for itemId: ${itemIdWithoutPrefix} to Pricer`,
        );

        // Update item image in Pricer without the prefix
        await this.pricerService.updateLabelImage(
          itemId,
          itemIdWithoutPrefix,
          0,
          0,
          processedImage,
        );

        this.logger.log(
          `Successfully updated image for itemId: ${itemId}`,
        );
      } catch (error) {
        this.logger.error(`Error processing itemId: ${itemId}`, error.stack);
      }
    }
  }
}
