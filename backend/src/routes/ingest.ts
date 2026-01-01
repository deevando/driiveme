import { FastifyInstance } from 'fastify';
import { OfferService, OfferPayload } from '../services/offer.service';

// Define a type for the options
interface IngestRouteOptions {
    offerService: typeof OfferService;
}

export async function ingestRoutes(fastify: FastifyInstance, options: IngestRouteOptions) {
    fastify.post('/ingest/webhook', async (request, reply) => {
        const body = request.body as any;

        // Auto-map fields if possible, or expect specific structure.
        // For MVP, we expect a clean JSON payload.
        // In production, we'd add an adapter for Cloudmailin/Sendgrid parses.

        try {
            const payload: OfferPayload = {
                externalId: body.externalId || body.id || `gen-${Date.now()}-${Math.random()}`,
                title: body.title || 'Oferta Driiveme',
                from: body.from || body.origin || 'Origen Desconocido',
                to: body.to || body.destination || 'Destino Desconocido',
                vehicle: body.vehicle || 'Turismo',
                price: body.price ? Number(body.price) : 1,
                pickupDate: body.pickupDate,
                dropoffDate: body.dropoffDate,
                link: body.link || 'https://www.driiveme.es',
                distance: body.distance ? Number(body.distance) : undefined,
                raw: body
            };

            const offer = await options.offerService.processOffer(payload);
            return { status: 'success', data: offer };
        } catch (e: any) {
            request.log.error(e);
            return reply.code(500).send({ status: 'error', message: e.message });
        }
    });
}
