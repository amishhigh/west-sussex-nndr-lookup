export type RateRecord = {
  propertyRef: string | number;
  parish: string;
  accountHolder: string;
  address: string;
  postcode: string;
  rateableValue: number;
  propertyType: string;
  isCharity: boolean;
  isDiscretionary: boolean;
  isMandatory: boolean;
  liableFrom: string;
  latitude: number | null;
  longitude: number | null;
};

export function cleanData(rows: Record<string, unknown>[]): RateRecord[] {
  return rows
    .filter((row) => row && Object.keys(row).length > 0)
    .map((row) => {
      const parishRaw = String(row['Parish'] ?? '').trim();
      const parish = parishRaw ? parishRaw.toUpperCase() : 'UNKNOWN';
      const addressParts = [
        row['Property Name 1'],
        row['Property Name 2'],
        row['Address 1'],
        row['Address 2'],
        row['Address 3'],
      ]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean);

      return {
        propertyRef: (row['Property Reference'] ?? '').toString().trim(),
        parish,
        accountHolder: String(row['Account Holder 1'] ?? '').trim(),
        address: addressParts.join(', '),
        postcode: String(row['Post Code'] ?? '').trim(),
        rateableValue: Number(row['Rateable Value']) || 0,
        propertyType: String(row['Property Description'] ?? '').trim() || 'Unknown',
        isCharity: String(row['Charity'] ?? '').trim().toUpperCase() === 'Y',
        isDiscretionary: String(row['Discretionary'] ?? '').trim().toUpperCase() === 'Y',
        isMandatory: String(row['Mandatory'] ?? '').trim().toUpperCase() === 'Y',
        liableFrom: String(row['Liable From'] ?? '').trim(),
        latitude: Number(row['Latitude']) || null,
        longitude: Number(row['Longitude']) || null,
      };
    });
}
