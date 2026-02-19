import { describe, expect, it, vi, beforeEach, afterAll, beforeAll } from 'vitest';
import { createApp, toPlainHandler, toWebHandler } from 'h3'
import sseEndpoint from '../../../src/runtime/core/server/sse'
 import { createHooks, Hookable } from 'hookable'
import { useNitroApp } from 'nitropack/runtime';
import type { NitroRuntimeHooks } from 'nitropack/types';
import { createServer } from "node:http";
import { toNodeListener } from "h3";
import {
    getRandomPort,
} from "get-port-please";

vi.mock('nitropack/runtime', async () => ({
    useNitroApp: vi.fn()
}))

const app = createApp()

app.use('/', sseEndpoint)
const handler = toWebHandler(app)
const server =createServer(toNodeListener(app));

describe('sseEndpoint', () => {
    let hooks: Hookable<NitroRuntimeHooks>
    let port: number

    beforeAll(async () => {
        port = await getRandomPort()
        server.listen(port, () => {
            console.log(`Test server running on http://localhost:${port}`)
        })
    })

    beforeEach(() => {
        hooks = createHooks()
        vi.mocked(useNitroApp).mockReturnValue({ hooks } as unknown as ReturnType<typeof useNitroApp>)
    })

    afterAll(() => {
        server.close()
    })

    it('should call registered SSE handlers on setup', async () => {
        const mockHandler = vi.fn() 

        hooks.hook('hints:sse:setup', mockHandler)
        const response = await handler(new Request(new URL("/", `http://localhost:${port}`)))
        expect(mockHandler).toHaveBeenCalled()
        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    })
})