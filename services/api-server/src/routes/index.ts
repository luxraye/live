import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import donorRouter from "./donor";
import centresRouter from './centres';
import articlesRouter from './articles';
import networkRouter from './network';
import feedbackRouter from './feedback';
import statsRouter from './stats';
import adminRouter from './admin';

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(donorRouter);
router.use('/donor', donorRouter);
router.use('/centres', centresRouter);
router.use('/articles', articlesRouter);
router.use('/network', networkRouter);
router.use('/feedback', feedbackRouter);
router.use('/stats', statsRouter);
router.use('/admin', adminRouter);

export default router;
