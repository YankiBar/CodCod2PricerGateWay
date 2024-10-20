// getMatchingLabels.spec.ts
import { getMatchingLabels } from '../src/gateway/jobs/main-flow/Gateway.service';

describe('getMatchingLabels', () => {
  const logger = {
    warn: jest.fn(),
  };

  const pricerData = [
    { links: [{ itemId: '182194' }], modelName: 'Model A' },
    { links: [{ itemId: '1692' }], modelName: 'Model B' },
    { links: [{ itemId: 'D1234' }], modelName: 'Dynamic Model' },
  ];
  
  it('matches item IDs correctly by stripping "I" and "P" prefixes', () => {
    const codcodItems = {
      Items: [{ barcode: 'I182194' }, { barcode: 'D1234' }],
    };

    const codcodPromos = {
      promos: [{ promonum: 'P1692' }],
    };

    const matchedItems = getMatchingLabels(codcodItems, pricerData, logger);
    const matchedPromos = getMatchingLabels(codcodPromos, pricerData, logger);

    expect(matchedItems).toEqual([
      { itemId: '182194', modelName: 'Model A' },
      { itemId: 'D1234', modelName: 'Dynamic Model' },
    ]);
    expect(matchedPromos).toEqual([
      { itemId: '1692', modelName: 'Model B' },
    ]);
  });
});
