import { FastifyInstance } from 'fastify';
import { OfferService } from '../services/offer.service';

interface OfferRouteOptions {
    offerService: typeof OfferService;
}

export async function offerRoutes(fastify: FastifyInstance, options: OfferRouteOptions) {
    fastify.get('/offers', async (request, reply) => {
        const offers = await options.offerService.getRecentOffers();
        return offers;
    });
}
