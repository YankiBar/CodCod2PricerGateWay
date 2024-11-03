import { GatewayService } from 'src/gateway/jobs/main-flow/Gateway.service'
import { CodcodService } from 'src/codcod/codcod.service';
import { PricerService } from 'src/pricer/pricer.service';
import * as sharp from 'sharp';

jest.mock('src/codcod/codcod.service');
jest.mock('src/pricer/pricer.service');
jest.mock('sharp', () => {
  return jest.fn(() => ({
    rotate: jest.fn().mockReturnValue({
      resize: jest.fn().mockReturnValue({
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
      }),
    }),
  }));
});

describe('GatewayService - processImages', () => {
  let gatewayService: GatewayService;
  let codcodService: CodcodService;
  let pricerService: PricerService;

  beforeEach(() => {
    codcodService = new CodcodService(null, null); // adjust dependency injections
    pricerService = new PricerService(null, null); // adjust dependency injections
    gatewayService = new GatewayService(codcodService, pricerService, null);
  });

  it('should fetch the correct sign and strip prefix before updating', async () => {
    // Mock functions
    codcodService.getItemSign = jest.fn().mockResolvedValue(Buffer.from('mock-image'));
    codcodService.getPromoSign = jest.fn().mockResolvedValue(Buffer.from('mock-image'));
    codcodService.getSign = jest.fn().mockResolvedValue(Buffer.from('mock-image'));
    pricerService.updateLabelImage = jest.fn();

    const items = [
      { itemId: 'I182194', modelName: 'Model A' },
      { itemId: 'P1692', modelName: 'Model B' },
      { itemId: 'D1234', modelName: 'Dynamic Model' },
    ];

    await gatewayService.processImages(items);

    expect(codcodService.getItemSign).toHaveBeenCalledWith('I182194', '768X920');
    expect(codcodService.getPromoSign).toHaveBeenCalledWith('P1692', '768X920');
    expect(codcodService.getSign).toHaveBeenCalledWith('D1234', '768X920');

    expect(pricerService.updateLabelImage).toHaveBeenCalledWith('182194', 0, 0, expect.any(Buffer));
    expect(pricerService.updateLabelImage).toHaveBeenCalledWith('1692', 0, 0, expect.any(Buffer));
    expect(pricerService.updateLabelImage).toHaveBeenCalledWith('D1234', 0, 0, expect.any(Buffer));
  });

  it('should log and continue if fetch image fails', async () => {
    const loggerSpy = jest.spyOn(gatewayService['logger'], 'warn').mockImplementation(() => {});
    
    // Mock the getItemSign to fail
    codcodService.getItemSign = jest.fn().mockRejectedValue(new Error('Failed to fetch image'));

    const items = [{ itemId: 'I182194', modelName: 'Model A' }];

    await gatewayService.processImages(items);

    expect(loggerSpy).toHaveBeenCalledWith('No image found for itemId: I182194');
  });
});