import axios from 'axios';
import { OfferService } from './offer.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DriivemeTransport {
    id: number;
    status: number;
    departure: {
        id: number;
        name: string;
        city: string;
        country: string;
        latitude: number;
        longitude: number;
    };
    destination: {
        id: number;
        name: string;
        city: string;
        country: string;
        latitude: number;
        longitude: number;
    };
    vehicle: {
        id: number;
        category: string;
        model: string;
        registration: string;
        vin: string;
    };
    reservation?: {
        id: number;
        creationDate: string;
    };
    distance?: number;
    price?: number; // Sometimes price is not in the object, assume 1 euro or free
}

interface DriivemeResponse {
    transports: DriivemeTransport[];
}

export class DriivemeService {
    private apiKey: string;
    private apiUrl = 'https://www.driiveme.com/api/transport/list';
    private isPolling = false;
    private pollingInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.apiKey = process.env.DRIIVEME_API_KEY || '';
        if (!this.apiKey) {
            console.warn('WARNING: DRIIVEME_API_KEY is not set. Polling will fail.');
        }
    }

    async fetchAvailableTransports() {
        if (!this.apiKey || this.apiKey === 'DEMO') {
            console.log('Polling: Running in DEMO MODE (Generating mock offers)');
            await this.generateMockOffers();
            return;
        }

        try {
            console.log('Polling Driiveme API (Real Data)...');
            const response = await axios.post<DriivemeResponse>(`${this.apiUrl}?key=${this.apiKey}`, {
                status: [0] // 0 = Available
            });

            const transports = response.data.transports || [];
            console.log(`Found ${transports.length} transports from API.`);

            for (const transport of transports) {
                await this.processTransport(transport);
            }

        } catch (error) {
            console.error('Error fetching from Driiveme API:', error);
        }
    }

    private async generateMockOffers() {
        // Generate 1-3 random offers
        const count = Math.floor(Math.random() * 3) + 1;
        const cities = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza', 'Alicante'];
        const vehicles = ['Renault Clio', 'Fiat 500', 'Peugeot 208', 'Volkswagen Polo', 'Citroen C3', 'Ford Fiesta'];

        for (let i = 0; i < count; i++) {
            const from = cities[Math.floor(Math.random() * cities.length)];
            let to = cities[Math.floor(Math.random() * cities.length)];
            while (from === to) to = cities[Math.floor(Math.random() * cities.length)];

            const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
            const id = Math.floor(Math.random() * 100000);

            const offerData = {
                externalId: `demo-${id}-${Date.now()}`,
                title: `${vehicle} de ${from} a ${to}`,
                from: from,
                to: to,
                vehicle: `${vehicle} (Demo)`,
                price: 1,
                pickupDate: new Date().toISOString(), // Use ISO string for consistency
                dropoffDate: new Date(Date.now() + 86400000 * 2).toISOString(),
                link: 'https://www.driiveme.es/ofertas-alquiler-coches-1.html',
                distance: Math.floor(Math.random() * 500) + 100,
                raw: { demo: true },
                // detectedAt is created in OfferService
            };

            await OfferService.processOffer(offerData);
        }
    }

    private async processTransport(transport: DriivemeTransport) {
        // Map Driiveme Transport to our Offer model

        // Link construction (approximate, based on ID)
        const link = `https://www.driiveme.com/transport/${transport.id}`;

        // Price is often 1 euro for Driiveme
        const price = transport.price !== undefined ? transport.price : 1.00;

        const offerData = {
            externalId: `driiveme-${transport.id}`,
            title: `${transport.vehicle.model} from ${transport.departure.city} to ${transport.destination.city}`,
            from: transport.departure.city,
            to: transport.destination.city,
            vehicle: `${transport.vehicle.model} (${transport.vehicle.category})`,
            price: price,
            pickupDate: undefined, // Leave undefined if not sure, let service handle it
            dropoffDate: undefined,
            link: link,
            distance: transport.distance || 0,
            raw: transport,
            // detectedAt handles by service
        };

        // Use the existing OfferService
        await OfferService.processOffer(offerData);
    }

    startPolling(intervalMs: number = 60000) {
        if (this.isPolling) return;
        this.isPolling = true;
        console.log(`Starting Driiveme Polling every ${intervalMs}ms`);

        // Initial fetch
        this.fetchAvailableTransports();

        this.pollingInterval = setInterval(() => {
            this.fetchAvailableTransports();
        }, intervalMs);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
    }
}

export const driivemeService = new DriivemeService();
