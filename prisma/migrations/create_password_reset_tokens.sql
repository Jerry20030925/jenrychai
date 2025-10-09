-- CreateTable: password_reset_tokens
-- 用于存储密码重置令牌

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: 为token字段创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex: 为email字段创建索引（提升查询性能）
CREATE INDEX IF NOT EXISTS "password_reset_tokens_email_idx" ON "password_reset_tokens"("email");

-- CreateIndex: 为token字段创建索引（提升查询性能）
CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- 添加注释
COMMENT ON TABLE "password_reset_tokens" IS '密码重置令牌表';
COMMENT ON COLUMN "password_reset_tokens"."id" IS '主键ID';
COMMENT ON COLUMN "password_reset_tokens"."email" IS '用户邮箱';
COMMENT ON COLUMN "password_reset_tokens"."token" IS '重置令牌（唯一）';
COMMENT ON COLUMN "password_reset_tokens"."expires" IS '过期时间';
COMMENT ON COLUMN "password_reset_tokens"."created_at" IS '创建时间';
