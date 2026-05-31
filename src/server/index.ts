import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import chalk from 'chalk'
import open from 'open'
import { createServer } from 'net'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { existsSync } from 'fs'
import { ZodError } from 'zod'
import { APP_NAME, APP_VERSION } from '@shared/constants'
import { vaultsPlugin } from './routes/vaults'
import { notesPlugin } from './routes/notes'
import { gitPlugin } from './routes/git'
import { docsPlugin } from './routes/docs'
import { loadConfig } from './config/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === 'development'

function findPort(start: number): Promise<number> {
  return new Promise((res) => {
    const srv = createServer()
    srv.listen(start, '127.0.0.1', () => {
      const port = (srv.address() as { port: number }).port
      srv.close(() => res(port))
    })
    srv.on('error', () => findPort(start + 1).then(res))
  })
}

async function main() {
  const port = await findPort(3741)

  const fastify = Fastify({
    logger: isDev
      ? {
          level: 'info',
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              ignore: 'pid,hostname',
              translateTime: 'HH:MM:ss',
            },
          },
        }
      : { level: 'warn' },
  })

  fastify.setErrorHandler(async (error, request, reply) => {
    if (error instanceof ZodError) {
      reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors.map((e) => e.message).join('; '),
        },
      })
      return
    }
    const err = error as Error & { statusCode?: number }
    const statusCode = err.statusCode ?? 500
    fastify.log.error({ url: request.url, statusCode }, err.message)
    reply.code(statusCode).send({ error: { code: 'ERROR', message: err.message } })
  })

  fastify.get('/api/health', async () => ({
    data: { status: 'ok', app: APP_NAME, version: APP_VERSION },
  }))

  await fastify.register(vaultsPlugin, { prefix: '/api' })
  await fastify.register(notesPlugin, { prefix: '/api' })
  await fastify.register(gitPlugin, { prefix: '/api' })
  await fastify.register(docsPlugin, { prefix: '/api' })

  await loadConfig()

  if (!isDev) {
    const distPath = resolve(__dirname, '../../dist/client')
    if (existsSync(distPath)) {
      await fastify.register(fastifyStatic, { root: distPath, prefix: '/' })
      fastify.setNotFoundHandler((request, reply) => {
        if (request.url.startsWith('/api')) {
          reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'API route not found' } })
        } else {
          reply.sendFile('index.html')
        }
      })
    }
  }

  await fastify.listen({ port, host: '127.0.0.1' })

  const apiUrl = `http://localhost:${port}`
  const appUrl = isDev ? 'http://localhost:5173' : apiUrl

  // Print banner after logger output so it's clearly visible
  process.stdout.write('\n')
  console.log(`  ${chalk.bold(APP_NAME)} ${chalk.gray(`v${APP_VERSION}`)}`)
  console.log()
  if (isDev) {
    console.log(`  ${chalk.gray('API')}    ${chalk.cyan(apiUrl)}`)
    console.log(`  ${chalk.gray('App')}    ${chalk.cyan.underline(appUrl)}  ${chalk.gray('← open in browser')}`)
  } else {
    console.log(`  ${chalk.gray('Running at')}  ${chalk.cyan.underline(appUrl)}`)
    await open(appUrl)
  }
  console.log()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
