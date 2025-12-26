import './hyperliquid'
import { evaluate } from './signal'
import { CONFIG } from './config'

setInterval(evaluate, CONFIG.evalIntervalMs)
