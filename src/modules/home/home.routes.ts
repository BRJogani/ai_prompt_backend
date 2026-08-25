import { Router } from 'express';
import { homeController } from './home.controller';

export const publicHomeRouter = Router();
publicHomeRouter.get('/', homeController.getHome);

export default { publicHomeRouter };
