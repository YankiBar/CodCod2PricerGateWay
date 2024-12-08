import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PricerService } from 'src/pricer/pricer.service';
import { MyLogger } from 'src/logger';
import { GatewayService } from 'src/gateway/jobs/main-flow/Gateway.service';

@Injectable()
export class LabelMonitorService {
  private readonly logger = new MyLogger();
  private readonly processedLabels = new Set<string>();

  constructor(
    private readonly pricerService: PricerService,
    private readonly gatewayService: GatewayService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkForNewLabels(): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

    this.logger.log(
      `Checking for new labels linked after ${fifteenMinutesAgo.toISOString()}`,
    );

    try {
      const labels = await this.pricerService.getAllLabelsInStore();

      const newLabels = labels.filter((label) => {
        const lastLinked = new Date(label.lastLinked);
        return (
          lastLinked > fifteenMinutesAgo &&
          !this.processedLabels.has(label.barcode)
        );
      });

      if (newLabels.length > 0) {
        this.logger.log(
          `Found ${newLabels.length} new labels linked in the last hour: ${JSON.stringify(newLabels, null, 2)}`,
        );
        // Prepare data for processImages
        const itemsToProcess = newLabels.map((label) => ({
          itemId: label.links[0].itemId,
          modelName: label.modelName,
        }));

        // Use processImages from GatewayService
        await this.gatewayService.processImages(itemsToProcess);
        // Add the processed labels to the Set
        newLabels.forEach((label) => this.processedLabels.add(label.barcode));
        this.logger.log(
          `Processed labels updated, current size: ${this.processedLabels.size}`,
        );
      } else {
        this.logger.log('No new labels linked in the last 15 minutes.');
      }
    } catch (error) {
      this.logger.error('Error checking for new labels:', error.stack);
    }
  }
  @Cron('0 * * * *') // Clear processed labels every hour at the top of the hour
  clearProcessedLabels(): void {
    this.logger.log('Clearing processed labels from the Set.');

    // Remove all processed labels since they are no longer valid after one hour
    this.processedLabels.clear();

    this.logger.log(
      `Processed labels set cleared. Current size: ${this.processedLabels.size}`,
    );
  }
}
