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

function getDesiredSize(modelName: string): {
  desiredWidth: number;
  desiredHeight: number;
} {
  switch (modelName) {
    case 'SmartTAG HDL Red 1328':
      return { desiredWidth: 296, desiredHeight: 128 };
    case 'SmartTAG HD110':
      return { desiredWidth: 400, desiredHeight: 300 };
    case 'SmartTAG HD200L Red':
      return { desiredWidth: 640, desiredHeight: 384 };
    case 'SmartTAG HD300 Red':
      return { desiredWidth: 1304, desiredHeight: 984 };
    default:
      return { desiredWidth: 768, desiredHeight: 920 }; // Default width and height
  }
}

function filterAndMachLabels(codcod: any[], labels: any[]) {
  const codcodItems = codcod.filter((item: { barcode: any }) => {
    labels.some((label: { itemId: any }) => label.itemId === item.barcode);
  });
}

function getMatchingLabels(codcod: any, pricer: any) {
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
    return [];
  }

  const matchingLabels = pricer.filter((label: { links: any[] }) =>
    label.links.some((link: { itemId: any }) => itemSet.has(link.itemId)),
  );
  return matchingLabels.map(
    (label: { links: { itemId: any }[]; modelName: any }) => ({
      itemId: label.links[0].itemId,
      modelName: label.modelName,
    }),
  );
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
      // this.logger.log('Codcod Items: ' + JSON.stringify(codcodItems));
      this.logger.log('Codcod Promos: ' + JSON.stringify(codcodPromos));

      // Fetch all labels from Pricer
      const allLabels = await this.pricerService.getAllLabelsInStore();
      // this.logger.log('All Labels: ' + JSON.stringify(allLabels));
      // if (Array.isArray(allLabels) || allLabels.length > 0) {
      //   for (const item of allLabels) {
      //     const links = item.links[0];
      //     console.log(`the ItemID of this lebal is: ${links.itemId}`);
      //   }
      // }

      // Filter items that exist in both Codcod and Pricer
      const filteredItemIds = getMatchingLabels(codcodItems, allLabels);

      const filteredPromoIds = getMatchingLabels(codcodPromos, allLabels);

      // Ensure proper processing
      this.logger.log('Filtered Items: ' + JSON.stringify(filteredItemIds));
      this.logger.log('Filtered Promos: ' + +JSON.stringify(filteredPromoIds));

      // Process the filtered items
      await this.processItems(filteredItemIds, 'items');
      await this.processItems(filteredPromoIds, 'promos');

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
        const image = await this.codcodService[nameFunction](itemId.itemId, size);
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
