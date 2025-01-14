import { config } from 'dotenv'
import { bool, cleanEnv, json, str } from 'envalid'
import { existsSync } from 'fs'

const cleanSpec = {
  CI: bool({ default: false }),
  ENV_DIR: str({ default: `${process.cwd()}/env` }),
  GCLOUD_SERVICE_KEY: json({ default: undefined }),
  KUBE_VERSION_OVERRIDE: str({ default: undefined }),
  OTOMI_DEV: bool({ default: false }),
  IN_DOCKER: bool({ default: false }),
  OTOMI_IN_TERMINAL: bool({ default: true }),
  STATIC_COLORS: bool({ default: false }),
  TESTING: bool({ default: false }),
  TRACE: bool({ default: false }),
  VALUES_INPUT: str({ desc: 'The chart values.yaml file', default: undefined }),
}
let pEnv: any = process.env
const path = `${pEnv.ENV_DIR}/.secrets`
if (pEnv.ENV_DIR && existsSync(path)) {
  const result = config({ path }) // this sets vars from .env onto process.env
  if (result.error) console.error(result.error)
  pEnv = { ...pEnv, ...result.parsed }
}
export const env = cleanEnv(pEnv, cleanSpec)
