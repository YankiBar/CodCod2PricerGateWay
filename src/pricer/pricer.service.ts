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

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseURL = this.configService.get<string>('PRICER_API_URL');
    this.username = this.configService.get<string>('PRICER_USERNAME');
    this.password = this.configService.get<string>('PRICER_PASSWORD');
  }

  async fetchLabels(
    start: number,
    limit: number,
    projection: string,
    serializeDatesToIso8601: boolean,
  ): Promise<any> {
    const url = `${this.baseURL}/api/public/core/v1/labels`;
    this.logger.log(`Fetching the labels from Pricer: start=${start}, limit=${limit}, projection=${projection}, serializeDatesToIso8601=${serializeDatesToIso8601}`);
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { projection, start, limit, serializeDatesToIso8601 },
          headers: {
            Accept: 'application/json',
          },
          auth: {
            username: this.username.toString(),
            password: this.password.toString(),
          },
        }),
      );
      this.logger.log(`Successfully fetched the labels from Pricer.`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Error fetching labels from Pricer: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Fetch labels from Pricer
  async getAllLabelsInStore(): Promise<any> {
    let pricerLabels = [];
    let start = 0;
    const limit = 500;
    try {
      do {
        const response = await this.fetchLabels(
          start,
          limit,
          this.projection,
          true,
        );
        pricerLabels = pricerLabels.concat(response);
        start += limit;
      } while (pricerLabels.length === limit);

      this.logger.log(`Processing completed. Fetched ${pricerLabels.length} labels.`);
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
    const url = `${this.baseURL}/api/public/core/v1/items/${itemId}/page/${pageIndex}`;

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
          auth: {
            username: this.username.toString(),
            password: this.password.toString(),
          },
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
      throw error;
    }
  }
}
