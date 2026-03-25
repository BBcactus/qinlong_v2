-- 迁移 002: AI 多提供商配置优化
-- 允许在页面直接配置 API Key，不再依赖环境变量

-- 为 ai_provider 增加直接存储的 api_key 字段
ALTER TABLE ai_provider ADD COLUMN IF NOT EXISTS api_key TEXT;

-- api_key_env 改为可选（兼容旧数据）
ALTER TABLE ai_provider ALTER COLUMN api_key_env DROP NOT NULL;
ALTER TABLE ai_provider ALTER COLUMN api_key_env SET DEFAULT '';

-- ai_skill 增加 max_tokens
ALTER TABLE ai_skill ADD COLUMN IF NOT EXISTS max_tokens INT NOT NULL DEFAULT 4096;

-- ai_agent 增加 provider_id 直接关联（可绕过 skill 直接指定模型）
ALTER TABLE ai_agent ADD COLUMN IF NOT EXISTS provider_id INT REFERENCES ai_provider(id);
ALTER TABLE ai_agent ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE ai_agent ADD COLUMN IF NOT EXISTS temperature NUMERIC NOT NULL DEFAULT 0.7;
ALTER TABLE ai_agent ADD COLUMN IF NOT EXISTS max_tokens INT NOT NULL DEFAULT 4096;
ALTER TABLE ai_agent ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE ai_agent ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 种子数据：更新默认提供商（api_key_env 改为空字符串）
UPDATE ai_provider SET api_key_env = '' WHERE api_key_env IS NULL;
