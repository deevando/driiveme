import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { OfferService } from './services/offer.service';
import { ingestRoutes } from './routes/ingest';
import { offerRoutes } from './routes/offers';

dotenv.config();

const fastify = Fastify({ logger: true });

// Setup CORS
fastify.register(cors, {
    origin: '*',
});

// Setup Socket.io
const io = new Server(fastify.server, {
    cors: {
        origin: '*',
    },
});

// Initialize Singleton
OfferService.setSocketServer(io);

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Register Routes
// We pass the singleton as option, though routes could import it directly too.
fastify.register(ingestRoutes, { offerService: OfferService, prefix: '/api' });
fastify.register(offerRoutes, { offerService: OfferService, prefix: '/api' });

// Basic Routes
fastify.get('/', async (request, reply) => {
    return { status: 'ok', service: 'Driiveme Ofertas YA Backend' };
});

// Start Polling Service for Official API
import { driivemeService } from './services/driiveme.service';
driivemeService.startPolling(60000); // Poll every 60 seconds

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        await fastify.listen({ port, host: '0.0.0.0' });
        fastify.log.info(`Server listening on ${fastify.server.address()}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
