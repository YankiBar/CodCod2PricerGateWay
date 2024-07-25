import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';

@Injectable()
export class PricerService {

  private readonly logger = new Logger(PricerService.name);
  private readonly baseURL: string;
  private readonly bearerToken: string;

  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {
    this.baseURL = this.configService.get<string>('PRICER_API_URL');
    this.bearerToken = this.configService.get<string>('PRICER_API_TOKEN');
  }

  async fetchItems(start: number, limit: number, projection: string): Promise<any> {
    const url = `${this.baseURL}/api/public/core/v1/items`;
    try {
      const response = await this.httpService.get(url, {
        params: { start, limit, projection },
        headers: { Authorization: `Bearer ${this.bearerToken}` },
      }).toPromise();
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching items from Pricer: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateItemImage(itemId: string, pageIndex: number, resize: number, image: Buffer): Promise<any> {
    const url = `${this.baseURL}/api/public/core/v1/items/${itemId}/page/${pageIndex}`;
    const formData = new FormData();
    formData.append('imageFile', image, 'image.png');

    try {
      const response = await this.httpService.put(url, formData, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          ...formData.getHeaders(),
        },
      }).toPromise();
      return response.data;
    } catch (error) {
      this.logger.error(`Error updating item image in Pricer: ${error.message}`, error.stack);
      throw error;
    }
  }
}
