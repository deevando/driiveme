import { prisma } from '../lib/prisma';
import { Server } from 'socket.io';

export interface OfferPayload {
    externalId: string;
    title: string;
    from: string;
    to: string;
    vehicle: string;
    price?: number;
    pickupDate?: string;
    dropoffDate?: string;
    link: string;
    distance?: number;
    raw?: any;
}

class OfferServiceImpl {
    private io: Server | null = null;

    setSocketServer(io: Server) {
        this.io = io;
    }

    async processOffer(payload: OfferPayload) {
        // 1. Check for duplicates
        const existing = await prisma.offer.findUnique({
            where: { externalId: payload.externalId },
        });

        if (existing) {
            console.log(`Skipping duplicate offer: ${payload.externalId}`);
            return existing;
        }

        // 2. Create new offer
        const newOffer = await prisma.offer.create({
            data: {
                externalId: payload.externalId,
                title: payload.title,
                fromCity: payload.from,
                toCity: payload.to,
                vehicle: payload.vehicle,
                price: payload.price,
                pickupDate: payload.pickupDate ? new Date(payload.pickupDate) : null,
                dropoffDate: payload.dropoffDate ? new Date(payload.dropoffDate) : null,
                link: payload.link,
                distance: payload.distance,
                rawJson: JSON.stringify(payload.raw || {}),
                detectedAt: new Date(),
            },
        });

        console.log(`New offer detected: ${newOffer.title} (${newOffer.fromCity} -> ${newOffer.toCity})`);

        // 3. Broadcast to all clients
        if (this.io) {
            this.io.emit('new_offer', newOffer);
        } else {
            console.warn('SocketIO not initialized in OfferService, skipping broadcast');
        }

        return newOffer;
    }

    async getRecentOffers(limit = 50) {
        return prisma.offer.findMany({
            orderBy: { detectedAt: 'desc' },
            take: limit,
        });
    }
}

export const OfferService = new OfferServiceImpl();
