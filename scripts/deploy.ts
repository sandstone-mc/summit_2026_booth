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

async function MCS_API<Route extends keyof MCS_Routes>(
    route: Route,
    params: MCS_Routes[Route]['params'],
    options?: {
        body?: any,
        path?: string,
        method?: 'POST' | 'OPTIONS',
        port_override: `${number}`
    },
) {
    const url = new URL(`${process.env.MCS_MANAGER_ENDPOINT}`)

    if (options?.port_override) {
        url.port = options.port_override
        url.pathname = '/'
    }

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
                token: `${process.env.MCS_MANAGER_TOKEN}`,
                uuid: `${process.env.MCS_MANAGER_UUID}`,
                daemonId: `${process.env.MCS_MANAGER_DAEMON_ID}`
            })
        }`,
        {
            method: options?.method ?? 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                Cookie: `${process.env.MCS_MANAGER_COOKIE}`
            },
            ...(options?.body === undefined ? {} : {
                body: options.body,
            })
        }
    )
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

// Main pack
const main_pack_zip = new AdmZip()

console.log('Deploy: reading and zipping main pack...')

await main_pack_zip.addLocalFolderPromise('.sandstone/output/datapack', { zipPath: '/' })
const main_pack = (await main_pack_zip.toBufferPromise()).buffer

console.log('Deploy: zip ready, uploading to server...')

await upload_zip(main_pack, `${SandstoneConfig.namespace}.zip`)

console.log(`Deploy: main pack uploaded, checking for dependencies...`)

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
}

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