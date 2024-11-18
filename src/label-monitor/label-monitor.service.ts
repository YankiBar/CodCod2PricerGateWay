import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PricerService } from 'src/pricer/pricer.service';
import { MyLogger } from 'src/logger';

@Injectable()
export class LabelMonitorService {
    private readonly logger = new MyLogger();
    private lastCheckedTime: Date;

    constructor(private readonly pricerService: PricerService) {
        this.lastCheckedTime = new Date();
    }

    @Cron(CronExpression.EVERY_MINUTE) // Set appropriate interval
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
                await this.fetchAndProcessImages(newLabels);
            } else {
                this.logger.log('No new labels linked in the last hour.');
            }

            // Update last checked time
            this.lastCheckedTime = new Date();
        } catch (error) {
            this.logger.error('Error checking for new labels:', error.stack);
        }
    }

    private async fetchAndProcessImages(newLabels: any[]): Promise<void> {
        for (const label of newLabels) {
            const itemId = label.links[0].itemId; // Assuming there's always at least one link
            const modelName = label.modelName;
            const size = getDesiredSize(modelName); // Use your existing `getDesiredSize` function

            try {
                this.logger.log(`Fetching image for new label linked to itemId: ${itemId}`);
                const image = await this.codcodService.getSign(itemId, size); // Fetch image
                if (image) {
                    // Perform your update image logic here
                    await this.pricerService.updateLabelImage(itemId, 0, 0, image); // Adjust parameters as necessary
                    this.logger.log(`Successfully updated image for itemId: ${itemId}`);
                } else {
                    this.logger.warn(`No image found for itemId: ${itemId}`);
                }
            } catch (error) {
                this.logger.error(`Error processing image for itemId: ${itemId}`, error.stack);
            }
        }
    }
}