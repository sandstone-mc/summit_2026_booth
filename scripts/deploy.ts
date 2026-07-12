import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'
import { io as io_client } from 'socket.io-client'

import SandstoneConfig from '../sandstone.config'

type MCS_Routes = {
    'files/upload': {
        params: {
            file_name: string,
            upload_dir: string,
        },
        response: {
            status: 200,
            time: number,
            data: {
                password: string,
                addr: `localhost:${number}`,
            },
        },
    },
    'upload-new': {
        params: {
            filename: string,
            size: `${number}`,
            sum: '',
            overwrite: `${boolean}`,
        },
        response: {
            status: 200,
            data: {
                id: string,
            },
        },
    },
    'upload-piece': {
        params: {
            offset: `${number}`,
        },
        response: 'OK'
    },
    'protected_instance/stream_channel': {
        params: {
            daemonId: string,
            uuid: string,
        },
        response: {
            status: number,
            data: {
                password: string,
                addr: string,
                prefix: string,
                remoteMappings?: any[],
            },
            time: number,
        },
    },
    'files/download': {
        params: {
            file_name: string,
        },
        response: {
            status: number,
            data: {
                password: string,
                addr: string,
                remoteMappings?: any[],
            },
            time: number,
        },
    },
}

// Mutable auth state — seeded from .env on first read, refreshed by login()
// when the panel rejects an API call with 403 (expired cookie or rotated token).
let cookie = `${process.env.MCS_MANAGER_COOKIE ?? ''}`
let token = `${process.env.MCS_MANAGER_TOKEN ?? ''}`

async function login(): Promise<void> {
    const username = process.env.MCS_MANAGER_USERNAME
    // Password is stored base64-encoded in .env to dodge dotenv's `#` comment
    // truncation and other shell-meaningful chars in the literal value.
    const password = atob(process.env.MCS_MANAGER_PASSWORD ?? '')
    if (!username || !password) {
        throw new Error(
            'Auth: session expired and MCS_MANAGER_USERNAME / MCS_MANAGER_PASSWORD are not set — add them to .env'
        )
    }

    console.log('Auth: session invalid, logging in...')

    const url = new URL(`${process.env.MCS_MANAGER_ENDPOINT}`)
    url.pathname = '/api/auth/login'
    url.search = ''

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            Origin: url.origin,
            Referer: url.origin + '/',
        },
        body: JSON.stringify({ username, password, code: '' }),
    })

    const body = (await resp.json().catch(() => null)) as { status?: number; data?: string } | null
    if (!resp.ok || body?.status !== 200 || !body?.data) {
        throw new Error(`Auth: login failed (HTTP ${resp.status}, body ${JSON.stringify(body)})`)
    }

    // Two Set-Cookie headers: <uuid>=<b64-session>; <uuid>.sig=<hmac>
    // Concatenate as "name=value; name2=value2" for the Cookie header.
    const set_cookies = (resp.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
    if (set_cookies.length < 2) {
        throw new Error(`Auth: expected 2 Set-Cookie headers, got ${set_cookies.length}`)
    }
    cookie = set_cookies.map((c) => c.split(';')[0].trim()).join('; ')

    // The login response body `data` field is the new session token.
    token = body.data

    await update_env_file(cookie, token)

    console.log(`Auth: logged in as ${username} (cookie ${cookie.length} bytes)`)
}

// Persist the refreshed session back to .env so the next deploy starts authed
// instead of round-tripping a login again. Lines are matched by exact key prefix
// and replaced in-place — preserves comments, ordering, and unrelated vars.
async function update_env_file(new_cookie: string, new_token: string): Promise<void> {
    // `String.prototype.replace` interprets `$` specially in the replacement
    // string; double-escape so cookie contents land literally.
    const escape_replace = (s: string) => s.replace(/\$/g, '$$$$')

    const env_path = path.join(process.cwd(), '.env')
    const content = await fs.promises.readFile(env_path, 'utf8')
    const updated = content
        .replace(/^MCS_MANAGER_COOKIE=.*$/m, `MCS_MANAGER_COOKIE=${escape_replace(new_cookie)}`)
        .replace(/^MCS_MANAGER_TOKEN=.*$/m, `MCS_MANAGER_TOKEN=${escape_replace(new_token)}`)

    if (updated === content) {
        console.log('Auth: .env missing MCS_MANAGER_COOKIE / MCS_MANAGER_TOKEN lines, skipping write')
        return
    }

    await fs.promises.writeFile(env_path, updated)
    console.log('Auth: refreshed MCS_MANAGER_COOKIE / MCS_MANAGER_TOKEN in .env')
}

// The cookie value is base64(session JSON) HMAC-signed. The session token lives
// inside that JSON. Mirror what the web panel's browser does: after every API
// response, if the server re-emitted Set-Cookie, adopt the rotated cookie AND
// the rotated token. Stays aligned with the server's view of the session.
//
// Note: koa-session emits Set-Cookie on most responses because the
// `requestSpeedLimit` middleware (permission.ts) pushes a timestamp into
// `SESSION_REQ_TIMES` per request, mutating the cookie payload + HMAC — but
// the session `token` inside the JSON does NOT change. So we always adopt
// the new cookie for next-request correctness, but only persist to .env when
// the token actually rotates (the only event the next deploy cares about).
async function sync_session_from_response(response: Response): Promise<void> {
    const set_cookies = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
    if (set_cookies.length < 2) return

    const new_cookie = set_cookies.map((c) => c.split(';')[0].trim()).join('; ')
    const new_token = parse_session_token(new_cookie)
    if (!new_token) return

    const token_rotated = new_token !== token
    cookie = new_cookie
    token = new_token

    if (token_rotated) {
        await update_env_file(cookie, token)
        console.log('Auth: token rotated, refreshed .env')
    }
}

// Decode the base64 session payload and return the embedded session token.
// Returns null if the cookie is malformed or has no token field.
function parse_session_token(cookie_str: string): string | null {
    const first = cookie_str.split(';')[0]?.trim() ?? ''
    const eq = first.indexOf('=')
    if (eq < 0) return null
    try {
        const json = JSON.parse(atob(first.slice(eq + 1)))
        return typeof json.token === 'string' ? json.token : null
    } catch {
        return null
    }
}

async function MCS_API<Route extends keyof MCS_Routes>(
    route: Route,
    params: MCS_Routes[Route]['params'],
    options?: {
        body?: any,
        path?: string,
        method?: 'POST' | 'OPTIONS',
        port_override: `${number}`
    },
): Promise<MCS_Routes[Route]['response']> {
    const url = new URL(`${process.env.MCS_MANAGER_ENDPOINT}`)

    if (options?.port_override) {
        url.port = options.port_override
        url.pathname = '/'
    }

    const do_request = async () => {
        const response = await fetch(
            `${
                url
            }${
                route
            }${
                options?.path === undefined ? '' : `/${options.path}`
            }?${
                new URLSearchParams({
                    ...params,
                    token,
                    uuid: `${process.env.MCS_MANAGER_UUID}`,
                    daemonId: `${process.env.MCS_MANAGER_DAEMON_ID}`
                })
            }`,
            {
                method: options?.method ?? 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Cookie: cookie
                },
                ...(options?.body === undefined ? {} : {
                    body: options.body,
                })
            }
        )
        return response
    }

    let response = await do_request()

    // Adopt any session rotation the server signaled in Set-Cookie headers.
    await sync_session_from_response(response)

    // Panel returns 403 on auth failure (cookie expired, stale token, etc).
    // Refresh once and retry — guards against the 1h session reset on `app.keys = [v4()]`.
    if (response.status === 403) {
        await login()
        response = await do_request()
        await sync_session_from_response(response)
    }

    const response_body = await response.text()

    if (response_body === 'OK') {
        return 'OK' as MCS_Routes[Route]['response']
    } else {
        try {
            return JSON.parse(response_body) as MCS_Routes[Route]['response']
        } catch (e) {
            console.log(arguments, response_body, response.url)
            throw new Error()
        }
    }
}

const remote_datapacks_dir = `${process.env.MCS_MANAGER_DATAPACKS_DIR}`

function start_upload(zip_name: string) {
    return MCS_API('files/upload', {
        file_name: `${zip_name}.zip`,
        upload_dir: remote_datapacks_dir,
    })
}

async function upload_chunks(upload_id: string, port: `${number}`, buffer: ArrayBuffer) {
    let offset = 0

    while (offset !== buffer.byteLength) {
        const new_offset = Math.min(offset + 2097374, buffer.byteLength)
        const form = new FormData()
        form.append('file', new Blob([buffer.slice(offset, new_offset)], { type: 'application/octet-stream' }))

        await MCS_API(
            'upload-piece',
            { offset: `${offset}` },
            {
                port_override: port,
                path: upload_id,
                body: form
            }
        )

        offset = new_offset
    }
}

async function upload_zip(buffer: ArrayBuffer, filename: string) {
    const upload_start = await start_upload(filename.replace('.zip', ''))
    const port = upload_start.data.addr.split(':')[1] as `${number}`

    const upload = await MCS_API(
        'upload-new',
        {
            filename,
            overwrite: 'true',
            size: `${buffer.byteLength}`,
            sum: ''
        },
        {
            port_override: port,
            path: upload_start.data.password
        }
    )

    await upload_chunks(upload.data.id, port, buffer)
}

const SCL_ONLY = process.argv.includes('--scl-only')

if (SCL_ONLY) console.log('SCL-only mode: skipping main pack, deps, and reload')

if (!SCL_ONLY) {
    // Main pack
    const main_pack_zip = new AdmZip()

    console.log('Deploy: reading and zipping main pack...')

    await main_pack_zip.addLocalFolderPromise('.sandstone/output/datapack', { zipPath: '/' })
    const main_pack = (await main_pack_zip.toBufferPromise()).buffer

    console.log('Deploy: zip ready, uploading to server...')

    await upload_zip(main_pack, `${SandstoneConfig.namespace}.zip`)

    console.log(`Deploy: main pack uploaded, checking for dependencies...`)
}

async function send_reload() {
    const daemon_url = `ws://${new URL(process.env.MCS_MANAGER_ENDPOINT ?? '').hostname}:24444`

    console.log('Reload: Getting initial WS Auth...')

    // Request a one-time stream password from the panel.
    const channel_resp = await MCS_API('protected_instance/stream_channel', {
        daemonId: `${process.env.MCS_MANAGER_DAEMON_ID}`,
        uuid: `${process.env.MCS_MANAGER_UUID}`,
    })

    if (channel_resp.status !== 200 || !channel_resp.data) {
        throw new Error(`Reload: stream_channel error, ${JSON.stringify(channel_resp)}`)
    }

    console.log('Reload: WS initial auth received, connecting...')

    const channel = channel_resp.data

    const sock = io_client(daemon_url, {
        transports: ['websocket'],
        path: (channel.prefix ? channel.prefix.replace(/\/$/, '') : '') + '/socket.io',
    })

    await new Promise<void>((resolve, reject) => {
        sock.once('connect', () => resolve())
        sock.once('connect_error', (err) => reject(err))
    })

    console.log('Reload: WS connected, getting WS session auth...')

    const auth_ok = await new Promise<boolean>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Reload: stream/auth timeout, failed')), 5_000)
        sock.once('stream/auth', (packet: any) => {
            clearTimeout(timer)
            resolve(packet?.status === 200 && packet?.data === true)
        })
        sock.emit('stream/auth', { data: { password: channel.password } })
    })

    if (!auth_ok) throw new Error('Reload: stream/auth failed')

    console.log('Reload: WS session authenticated, sending /reload to server...')

    sock.emit('stream/input', { data: { command: 'say [sandstone-deploy] Running `/reload`...' } })

    await new Promise<boolean>((resolve, reject) => {
        const timer = setTimeout(() => resolve(false), 10_000)
        sock.on('instance/stdout', (packet: any) => {
            const text = packet?.data?.text as string | undefined
            if (text?.includes('[sandstone-deploy] Running `/reload`...')) {
                clearTimeout(timer)
                resolve(true)
            }
        })
    })

    sock.emit('stream/input', { data: { command: 'reload' } })

    // Wait for `instance/stdout` to show the reload actually ran before disconnecting,
    // otherwise the close frame can race with the command packet.
    const reload_ran = await new Promise<boolean>((resolve, reject) => {
        const timer = setTimeout(() => resolve(false), 10_000)
        sock.on('instance/stdout', (packet: any) => {
            const text = packet?.data?.text as string | undefined
            if (text?.includes('Reloading!')) {
                clearTimeout(timer)
                resolve(true)
            }
        })
    })

    if (!reload_ran) throw new Error('Reload: did not see `Reloading!` on stdout, failed')

    console.log('Reload: successfully sent reload command, disconnecting WS...')

    // Graceful disconnect — wait for the disconnect event before exiting so the
    // engine.io close frame is actually flushed.
    await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2_000)
        sock.once('disconnect', () => {
            clearTimeout(timer)
            resolve()
        })
        sock.disconnect()
    })

    console.log('Reload: WS disconnected, success')
}

// SCL (Summit Core Library) — version check + auto-update.
// `scl_verison.txt` (sic, server-side typo) lives in /world/datapacks/ on the
// server; the vendors mirror serves the latest version + the replacement zip.
const SCL_ZIP_NAME = 'summit-dp-core.zip'
const SCL_VERSION_FILENAME = 'scl_verison.txt'
const SCL_VERSION_URL = 'https://vendors.internal.smithed.net/app/static/version.txt'
const SCL_DOWNLOAD_URL = 'https://vendors.internal.smithed.net/app/static/summit-dp-core.zip'

async function fetch_server_scl_version(): Promise<string | null> {
    try {
        const dl = await MCS_API('files/download', {
            file_name: `/world/datapacks/${SCL_VERSION_FILENAME}`,
        })
        if (dl.status !== 200 || !dl.data?.password) return null

        const host = new URL(process.env.MCS_MANAGER_ENDPOINT ?? '').hostname
        const port = dl.data.addr.split(':')[1]
        const url = `http://${host}:${port}/download/${dl.data.password}/${SCL_VERSION_FILENAME}`
        const resp = await fetch(url)
        if (!resp.ok) return null
        return (await resp.text()).trim() || null
    } catch {
        return null
    }
}

async function fetch_latest_scl_version(): Promise<string | null> {
    try {
        const resp = await fetch(SCL_VERSION_URL)
        if (!resp.ok) return null
        return (await resp.text()).trim() || null
    } catch {
        return null
    }
}

console.log('SCL: checking installed vs latest version...')

const server_scl_version = await fetch_server_scl_version()
const latest_scl_version = await fetch_latest_scl_version()

if (!server_scl_version) {
    console.log('SCL: could not read server version file, skipping update')
} else if (!latest_scl_version) {
    console.log('SCL: could not reach version manifest, skipping update')
} else if (server_scl_version === latest_scl_version) {
    console.log(`SCL: up to date (${server_scl_version})`)
} else {
    console.log(`SCL: server=${server_scl_version}, latest=${latest_scl_version}, downloading update...`)
    const zip_resp = await fetch(SCL_DOWNLOAD_URL)
    if (!zip_resp.ok) throw new Error(`SCL: download failed (${zip_resp.status})`)
    const zip_buffer = await zip_resp.arrayBuffer()
    await upload_zip(zip_buffer, SCL_ZIP_NAME)
    console.log(`SCL: uploaded ${SCL_ZIP_NAME} (${zip_buffer.byteLength} bytes)`)

    // Stamp the new version onto the server so the next deploy sees up-to-date.
    // Order matters: zip first, version last — if version write fails, future
    // deploys loop and retry the (idempotent) zip upload.
    console.log(`SCL: writing ${SCL_VERSION_FILENAME}...`)
    const version_buf = new TextEncoder().encode(latest_scl_version).buffer

    const vu = await MCS_API('files/upload', {
        file_name: SCL_VERSION_FILENAME,
        upload_dir: remote_datapacks_dir,
    })
    const vu_port = vu.data.addr.split(':')[1] as `${number}`

    const vu_meta = await MCS_API(
        'upload-new',
        {
            filename: SCL_VERSION_FILENAME,
            overwrite: 'true',
            size: `${version_buf.byteLength}`,
            sum: '',
        },
        { port_override: vu_port, path: vu.data.password },
    )

    await upload_chunks(vu_meta.data.id, vu_port, version_buf)
    console.log(`SCL: wrote ${SCL_VERSION_FILENAME} = ${latest_scl_version}`)

    if (SCL_ONLY) await send_reload()
}

if (!SCL_ONLY) {
    // Dependencies
    const SKIP_DEPS = ['summit-dp-core']
    const deps_dir = path.join(process.cwd(), '.sandstone/output/datapack_dependencies')
    const lockfile_path = path.join(process.cwd(), '.sandstone/deployed_dependencies.lock')

    let deployed: string[] = []
    try {
        deployed = JSON.parse(await fs.promises.readFile(lockfile_path, 'utf8'))
    } catch {}

    if (await fs.promises.exists(deps_dir)) {
        console.log('Deploy: dependencies found, zipping & uploading...')

        for (const entry of await fs.promises.readdir(deps_dir, { withFileTypes: true })) {
            if (entry.name.startsWith('.') || SKIP_DEPS.includes(entry.name)) continue

            const full_path = path.join(deps_dir, entry.name)
            const dep_name = entry.isFile() ? entry.name : `${entry.name}.zip`

            if (deployed.includes(dep_name)) continue

            let buffer: ArrayBuffer
            if (entry.isFile() && entry.name.endsWith('.zip')) {
                buffer = (await fs.promises.readFile(full_path)).buffer
            } else if (entry.isDirectory()) {
                const dep_zip = new AdmZip()
                await dep_zip.addLocalFolderPromise(path.relative(process.cwd(), full_path), { zipPath: '/' })
                buffer = (await dep_zip.toBufferPromise()).buffer
            } else {
                continue
            }

            await upload_zip(buffer, dep_name)
            deployed.push(dep_name)
        }
        await fs.promises.writeFile(lockfile_path, JSON.stringify(deployed))

        console.log('Deploy: dependencies uploaded, success')
    } else {
        console.log('Deploy: no dependencies found, success')
    }

    await send_reload()
}