import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import { firstValueFrom } from 'rxjs';
import { MyLogger } from 'src/logger';

@Injectable()
export class PricerService {
  private readonly logger = new MyLogger();
  private readonly baseURL: string;
  private readonly username: string;
  private readonly password: string;
  private readonly projection = 'M';
  private readonly defaultLimit: number = 500;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseURL = this.configService.get<string>('PRICER_API_URL');
    this.username = this.configService.get<string>('PRICER_USERNAME');
    this.password = this.configService.get<string>('PRICER_PASSWORD');
  }

  private constructUrl(endpoint: string): string {
    return `${this.baseURL}/api/public/core/v1/${endpoint}`;
  }

  private createAuthHeaders() {
    return {
      auth: {
        username: this.username,
        password: this.password,
      },
    };
  }

  // New method to fetch original country based on itemID
  async fetchOriginalCountry(
    itemId: string,
  ): Promise<{ OriginalCountry1?: string; OriginalCountry2?: string }> {
    const url = this.constructUrl(`items/${itemId}?projection=M`); // Adjust URL to fit your API endpoint for item details
    this.logger.log(`Fetching original country for itemId: ${itemId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Accept: 'application/json',
          },
          ...this.createAuthHeaders(),
        }),
      );

      // Check if the response contains expected field
      if (!response.data || !response.data.properties) {
        this.logger.warn(`No original country found for itemId: ${itemId}`);
        return {};
      }

      return {
        OriginalCountry1: response.data.properties.OriginalCountry1,
        OriginalCountry2: response.data.properties.OriginalCountry2,
      };
    } catch (error: any) {
      this.logger.error(
        `Error fetching original country for itemId ${itemId}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to fetch original country for itemId: ${itemId}`);
    }
  }

  async fetchLabels(
    start: number,
    limit: number = this.defaultLimit,
    projection: string = this.projection,
    serializeDatesToIso8601: boolean,
  ): Promise<any> {
    const url = this.constructUrl('labels');
    this.logger.log(
      `Fetching labels from ${url} with start=${start}, limit=${limit}`,
    );
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { projection, start, limit, serializeDatesToIso8601 },
          headers: {
            Accept: 'application/json',
          },
          ...this.createAuthHeaders(),
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Error fetching labels from Pricer: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to fetch labels: ${error.message}`);
    }
  }

  // Fetch labels from Pricer
  async getAllLabelsInStore(): Promise<any> {
    const pricerLabels: any[] = [];
    let start = 0;
    const limit = this.defaultLimit;
    try {
      while (true) {
        const response = await this.fetchLabels(
          start,
          limit,
          this.projection,
          true,
        );

        // Validate the response structure to avoid TypeError
        if (!response || !Array.isArray(response)) {
          this.logger.warn('No items found in response.');
          break; // Exit the loop if there's no valid data
        }
        // Append fetched labels
        pricerLabels.push(...response); // Use spread operator to add array items

        this.logger.log(
          `Processing completed. Fetched ${pricerLabels.length} labels.`,
        );

        // If the number of labels fetched is less than the limit, stop fetching
        if (response.length < limit) {
          this.logger.log('No more labels to fetch, completing the operation.');
          break;
        }

        // Increment the start position for pagination
        start += limit;
      }

      return pricerLabels;
    } catch (error: any) {
      this.logger.error('Error processing updates:', error.stack);
    }
  }

  async updateLabelImage(
    itemId: string,
    pageIndex: number,
    resize: number,
    image: Buffer,
  ): Promise<any> {
    const url = this.constructUrl(`items/${itemId}/page/${pageIndex}`);

    const formData = new FormData();

    // Append the image buffer with the original filename
    formData.append('imageFile', image, {
      filename: `${itemId}.png`,
      contentType: 'image/png',
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, formData, {
          params: { resize },
          headers: {
            ...formData.getHeaders(),
          },
          ...this.createAuthHeaders(),
        }),
      );

      this.logger.log(
        `Successfully updated image for itemId ${itemId}. Request ID: ${response.data.requestId}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error updating item image in Pricer: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to update image for ${itemId}: ${error.message}`);
    }
  }
}
