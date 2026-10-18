import { Router } from 'express';
import { issueCsrfToken, verifyCsrfToken } from './middlewares/csrfProtection.js';
import { authenticate } from './middlewares/requireAuth.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { commentsRouter, postCommentsRouter } from './modules/comments/comments.routes.js';
import { suggestionsRouter, userFollowsRouter } from './modules/follows/follows.routes.js';
import { feedRouter } from './modules/feed/feed.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { commentLikeRouter, postLikeRouter } from './modules/likes/likes.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { postsRouter, userPostsRouter } from './modules/posts/posts.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);

apiRouter.use(issueCsrfToken, verifyCsrfToken, authenticate);

apiRouter.use('/auth', authRouter);

apiRouter.use('/users/suggestions', suggestionsRouter);
apiRouter.use('/users/:username/posts', userPostsRouter);
apiRouter.use('/users/:username', userFollowsRouter);
apiRouter.use('/users', usersRouter);

apiRouter.use('/posts/:postId/comments', postCommentsRouter);
apiRouter.use('/posts/:postId/like', postLikeRouter);
apiRouter.use('/posts', postsRouter);

apiRouter.use('/comments/:commentId/like', commentLikeRouter);
apiRouter.use('/comments', commentsRouter);

apiRouter.use('/feed', feedRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/notifications', notificationsRouter);
