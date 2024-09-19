import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CodcodService } from 'src/codcod/codcod.service';
import { PricerService } from 'src/pricer/pricer.service';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { MyLogger } from '../../../logger';

interface MatchedLabel {
  itemId: string;
  modelName: string;
}

interface Promo {
  promonum: string;
  dsc: string;
}

interface Item {
  barcode: string;
}

interface Codcod {
  promos?: Promo[];
  Items?: Item[];
}

interface Label {
  links: { itemId: string }[];
  modelName: string;
}

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
      return { desiredWidth: 640, desiredHeight: 384 };
    case 'SmartTAG HD300 Red':
      return { desiredWidth: 1304, desiredHeight: 984 };
    default:
      return { desiredWidth: 768, desiredHeight: 920 }; // Default width and height
  }
}

function getMatchingLabels(codcod: Codcod, pricer: Label[]): MatchedLabel[] {
  const itemSet = codcod.promos
    ? new Set(codcod.promos.map((promo) => promo.promonum))
    : codcod.Items
      ? new Set(codcod.Items.map((item) => item.barcode))
      : new Set();

  // Handle empty itemSet and log as necessary
  if (itemSet.size === 0) {
    console.error(
      'Neither promos nor items are present in the provided Codcod object.',
    );
    return [];
  }

  return pricer
    .filter((label) => label.links.some((link) => itemSet.has(link.itemId)))
    .map((label) => ({
      itemId: label.links[0].itemId,
      modelName: label.modelName,
    }));
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
    this.storeId = this.configService.get<string>('STORE_ID', '16');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processUpdates(): Promise<void> {
    const lastUpdateTime = new Date().toISOString();
    const updatedTime = addHoursToUtcTime(lastUpdateTime, 3);

    this.logger.log(`Processing updates since ${updatedTime}`);

    try {
      // Fetch updated items from Codcod
      const codcodItems = {
        Items: await this.codcodService.getAllBranchItems(this.storeId) || []
      };
      
      const codcodPromos = {
        promos: await this.codcodService.getAllBranchPromos(this.storeId) || []
      };
      
      this.logger.log('Codcod Items: ' + JSON.stringify(codcodItems, null, 2));
      this.logger.log(
        'Codcod Promos: ' + JSON.stringify(codcodPromos, null, 2),
      );

      // Fetch all labels from Pricer
      const allLabels = await this.pricerService.getAllLabelsInStore();

      // Filter items that exist in both Codcod and Pricer
      const filteredItemIds = getMatchingLabels(codcodItems, allLabels);
      const filteredPromoIds = getMatchingLabels(codcodPromos, allLabels);

      this.logger.log('Filtered Items: ' + JSON.stringify(filteredItemIds, null, 2));
      this.logger.log('Filtered Promos: ' + JSON.stringify(filteredPromoIds, null, 2));
      

      await Promise.all([
        this.processItems(filteredItemIds, 'items'),
        this.processItems(filteredPromoIds, 'promos'),
      ]);
      this.logger.log('Processing completed.');
    } catch (error) {
      // Ensure error logging passes only the message and stack as two distinct strings
      this.logger.error('Error processing updates:', error.stack);
    }
  }

  async processItems(itemIds: MatchedLabel[], source: string): Promise<void> {
    const size = source === 'items' ? '768X920' : '158x640';
    const itemOrPromo = source === 'items' ? 'getItemSign' : 'getPromoSign';

    for (const itemId of itemIds) {
      const { desiredWidth, desiredHeight } = getDesiredSize(itemId.modelName);

      try {
        // Fetch item image from Codcod
        const image = await this.codcodService[itemOrPromo](
          itemId.itemId,
          size,
        );
        if (!image) {
          this.logger.warn(`No image found for itemId: ${itemId}`);
          continue;
        }

        const processedImage = await sharp(image)
          .rotate(90)
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
