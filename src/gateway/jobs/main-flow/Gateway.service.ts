import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CodcodService } from 'src/codcod/codcod.service';
import { PricerService } from 'src/pricer/pricer.service';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { MyLogger } from '../../../logger';

function addHoursToUtcTime(originalTime: string, hoursToAdd: number): string {
  const date = new Date(originalTime);
  date.setUTCHours(date.getUTCHours() + hoursToAdd);
  return date.toISOString();
}

function getDesiredSize(modelName: string): { desiredWidth: number; desiredHeight: number } {
  switch (modelName) {
    case 'SmartTAG HDL Red 1328':
      return { desiredWidth: 296, desiredHeight: 128 };
    case 'SmartTAG HD110':
    case 'Image':
      return { desiredWidth: 400, desiredHeight: 300 };
    case 'SmartTAG HD200L Red':
      return { desiredWidth: 640, desiredHeight: 384 };
    case 'SmartTAG HD300 Red':
      return { desiredWidth: 1304, desiredHeight: 984 };
    default:
      return { desiredWidth: 768, desiredHeight: 920 };
  }
}
function getMatchingLabels(codcod: any, pricer: any, logger: any) {
  let itemSet: Set<unknown>;
  if (codcod.promos) {
    itemSet = new Set(
      codcod.promos.map((promo: { promonum: any }) => promo.promonum),
    );
  } else if (codcod.Items) {
    itemSet = new Set(
      codcod.Items.map((item: { barcode: any }) => item.barcode),
    );
  } else {
    logger.warn('No items found in Codcod data');
    return [];
  }

  const matchingLabels = pricer.filter((label: { links: any[] }) =>
    label.links.some((link: { itemId: any }) => itemSet.has(link.itemId)),
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

  @Cron(CronExpression.EVERY_MINUTE)
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

      const filteredItemIds = getMatchingLabels(codcodItems, allLabels, this.logger);
      const filteredPromoIds = getMatchingLabels(codcodPromos, allLabels, this.logger);

      // Ensure proper processing
      this.logger.log('Filtered Items: ' + JSON.stringify(filteredItemIds, null, 2));
      this.logger.log('Filtered Promos: ' + JSON.stringify(filteredPromoIds, null, 2));
      
      await Promise.all([
        this.processItems(filteredItemIds, 'items'),
        this.processItems(filteredPromoIds, 'promos'),
      ]);

      this.logger.log('Processing completed.');
    } catch (error) {
      this.logger.error('Error processing updates:', error.stack);
    }
  }

  async processItems(
    itemIds: { itemId: string; modelName: string }[],
    source: string,
  ): Promise<void> {
    const size = source === 'items' ? '768X920' : '158x640';
    const nameFunction = source === 'items' ? 'getItemSign' : 'getPromoSign';

    for (const itemId of itemIds) {
      const { desiredWidth, desiredHeight } = getDesiredSize(itemId.modelName);

      try {
        // Fetch item image from Codcod
        const image = await this.codcodService[nameFunction](
          itemId.itemId,
          size,
        );
        if (!image) {
          this.logger.warn(`No image found for itemId: ${itemId}`);
          continue;
        }

        const processedImage = await sharp(image)
          .rotate(90) // Rotate image 90 degrees to the right
          .resize(desiredWidth, desiredHeight, {
            fit: 'fill',
          })
          .toBuffer();

        // Update item image in Pricer
        await this.pricerService.updateLabelImage(
          itemId.itemId,
          0,
          0,
          processedImage,
        );
        this.logger.log(
          `Successfully updated image for itemId: ${itemId.itemId}`,
        );
      } catch (error) {
        this.logger.error(
          `Error processing itemId: ${itemId.itemId}`,
          error.stack,
        );
      }
    }
  }
}
