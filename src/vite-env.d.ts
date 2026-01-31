/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MINIMAX_API_KEY?: string
  readonly VITE_MINIMAX_GROUP_ID?: string
  readonly VITE_MANUS_API_KEY?: string
  readonly VITE_OPENAI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
