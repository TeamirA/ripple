-- Trigram indexes keep ILIKE '%term%' user search fast.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "User_username_trgm_idx" ON "User" USING GIN ("username" gin_trgm_ops);
CREATE INDEX "User_displayName_trgm_idx" ON "User" USING GIN ("displayName" gin_trgm_ops);
CREATE INDEX "Post_content_trgm_idx" ON "Post" USING GIN ("content" gin_trgm_ops);

-- Full-text index for keyword post search.
CREATE INDEX "Post_content_fts_idx" ON "Post" USING GIN (to_tsvector('english', "content"));

-- Denormalized counters must never drift below zero.
ALTER TABLE "User"
  ADD CONSTRAINT "User_postsCount_nonnegative" CHECK ("postsCount" >= 0),
  ADD CONSTRAINT "User_followersCount_nonnegative" CHECK ("followersCount" >= 0),
  ADD CONSTRAINT "User_followingCount_nonnegative" CHECK ("followingCount" >= 0);

ALTER TABLE "Post"
  ADD CONSTRAINT "Post_likesCount_nonnegative" CHECK ("likesCount" >= 0),
  ADD CONSTRAINT "Post_commentsCount_nonnegative" CHECK ("commentsCount" >= 0);

ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_likesCount_nonnegative" CHECK ("likesCount" >= 0),
  ADD CONSTRAINT "Comment_repliesCount_nonnegative" CHECK ("repliesCount" >= 0);

ALTER TABLE "Follow"
  ADD CONSTRAINT "Follow_no_self_follow" CHECK ("followerId" <> "followingId");
