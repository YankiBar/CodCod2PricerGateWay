import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PricerService } from 'src/pricer/pricer.service';
import { MyLogger } from 'src/logger';
import { GatewayService } from 'src/gateway/jobs/main-flow/Gateway.service';

@Injectable()
export class LabelMonitorService {
    private readonly logger = new MyLogger();
    private lastCheckedTime: Date;

    constructor(private readonly pricerService: PricerService,
            private readonly gatewayService: GatewayService,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async checkForNewLabels(): Promise<void> {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        this.logger.log(`Checking for new labels linked after ${oneHourAgo.toISOString()}`);

        try {
            const labels = await this.pricerService.getAllLabelsInStore(); // Adjust for projection 'L'

            const newLabels = labels.filter(label => {
                const lastLinked = new Date(label.lastLinked);
                return lastLinked > oneHourAgo; // Check if the label was linked in the last hour
            });

            if (newLabels.length > 0) {
                this.logger.log(`Found ${newLabels.length} new labels linked in the last hour: ${JSON.stringify(newLabels, null, 2)}`);
                // Prepare data for processImages
                const itemsToProcess = newLabels.map(label => ({
                    itemId: label.links[0].itemId,
                    modelName: label.modelName
                }));

                // Use processImages from GatewayService
                await this.gatewayService.processImages(itemsToProcess);

            } else {
                this.logger.log('No new labels linked in the last hour.');
            }
        } catch (error) {
            this.logger.error('Error checking for new labels:', error.stack);
        }
    }
}