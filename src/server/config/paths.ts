import { homedir } from 'os'
import { join } from 'path'

export const CONFIG_DIR = join(homedir(), '.config', 'obsidian-valet')
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
