import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getSettings, updateSettings } from '../config/settings'

export const settingsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/settings', async () => {
    const settings = await getSettings()
    return { data: settings }
  })

  fastify.patch('/settings', async (request) => {
    // Accept any object; the settings schema validates/sanitizes the merged result.
    const patch = z.record(z.unknown()).catch({}).parse(request.body)
    const settings = await updateSettings(patch)
    return { data: settings }
  })
}
