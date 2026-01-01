export interface Offer {
    id: string;
    externalId: string;
    title: string;
    fromCity: string;
    toCity: string;
    vehicle: string;
    price?: number;
    pickupDate?: string;
    dropoffDate?: string;
    link: string;
    detectedAt: string;
    distance?: number;
}
