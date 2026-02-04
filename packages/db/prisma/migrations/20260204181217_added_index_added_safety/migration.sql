/*
  Warnings:

  - A unique constraint covering the columns `[story_id,user_id]` on the table `reaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."message" DROP CONSTRAINT "message_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."message" DROP CONSTRAINT "message_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reaction" DROP CONSTRAINT "reaction_message_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reaction" DROP CONSTRAINT "reaction_story_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reaction" DROP CONSTRAINT "reaction_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."story" DROP CONSTRAINT "story_user_id_fkey";

-- CreateIndex
CREATE INDEX "conversation_created_by_idx" ON "conversation"("created_by");

-- CreateIndex
CREATE INDEX "message_sender_id_idx" ON "message"("sender_id");

-- CreateIndex
CREATE INDEX "message_reply_to_idx" ON "message"("reply_to");

-- CreateIndex
CREATE INDEX "reaction_story_id_idx" ON "reaction"("story_id");

-- CreateIndex
CREATE INDEX "reaction_user_id_idx" ON "reaction"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_story_id_user_id_key" ON "reaction"("story_id", "user_id");

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story" ADD CONSTRAINT "story_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
