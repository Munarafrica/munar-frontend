import { Router } from 'express';
import authRouter from './auth.routes';
import eventsRouter from './events.routes';
import ticketsRouter from './tickets.routes';
import programRouter from './program.routes';
import formsRouter from './forms.routes';
import sponsorsRouter from './sponsors.routes';
import merchandiseRouter from './merchandise.routes';
import votingRouter from './voting.routes';
import publicRouter from './public.routes';

export const router = Router();

router.use('/auth', authRouter);
router.use('/events', eventsRouter);
router.use('/events', ticketsRouter);
router.use('/events', programRouter);
router.use('/events', formsRouter);
router.use('/events', sponsorsRouter);
router.use('/events', merchandiseRouter);
router.use('/events', votingRouter);
router.use('/public', publicRouter);
