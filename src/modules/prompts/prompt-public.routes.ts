import { Router } from 'express';
import { publicPromptController } from './prompt-public.controller';
import { validate } from '@middleware/validate';
import { publicPromptListQuerySchema, promptSearchQuerySchema } from '@validators/prompt.validator';
import { paginationQuerySchema, idParamSchema } from '@validators/common.validator';

const router = Router();

// IMPORTANT: these fixed-segment routes must be registered before '/:id',
// otherwise Express matches e.g. "/trending" as :id="trending" and the
// UUID validator rejects it with a 400 instead of routing correctly.
router.get('/trending', validate(paginationQuerySchema, 'query'), publicPromptController.trending);
router.get('/popular', validate(paginationQuerySchema, 'query'), publicPromptController.popular);
router.get('/latest', validate(paginationQuerySchema, 'query'), publicPromptController.latest);
router.get('/new', validate(paginationQuerySchema, 'query'), publicPromptController.latest);
router.get('/premium', validate(paginationQuerySchema, 'query'), publicPromptController.premium);
router.get('/free', validate(paginationQuerySchema, 'query'), publicPromptController.free);
router.get('/popular-videos', validate(paginationQuerySchema, 'query'), publicPromptController.popularVideos);
router.get('/popular-images', validate(paginationQuerySchema, 'query'), publicPromptController.popularImages);
router.get('/featured', validate(paginationQuerySchema, 'query'), publicPromptController.featured);
router.get('/search', validate(promptSearchQuerySchema, 'query'), publicPromptController.search);

router.get('/', validate(publicPromptListQuerySchema, 'query'), publicPromptController.list);
router.get('/:id', validate(idParamSchema(), 'params'), publicPromptController.getById);

export default router;

