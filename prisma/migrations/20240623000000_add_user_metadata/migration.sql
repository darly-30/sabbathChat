-- Agregar el campo metadata a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Crear tabla para tokens de Google Drive
CREATE TABLE drive_tokens (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP(3) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT drive_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT drive_tokens_user_id_key UNIQUE (user_id),
  CONSTRAINT drive_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);