import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'

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
    const endpoint = new URL(`${process.env.MCS_MANAGER_ENDPOINT}`)

    if (options?.port_override) {
        endpoint.port = options.port_override
        endpoint.pathname = '/'
    }

    const response = await fetch(
        `${
            endpoint
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
await main_pack_zip.addLocalFolderPromise(path.join(process.cwd(), '.sandstone/output/datapack'), { zipPath: '/' })
const main_pack = (await main_pack_zip.toBufferPromise()).buffer

await upload_zip(main_pack, `${SandstoneConfig.namespace}.zip`)
console.log(`Deployed: ${SandstoneConfig.namespace}`)

// Dependencies
const SKIP_DEPS = ['summit-dp-core']
const deps_dir = path.join(process.cwd(), '.sandstone/output/datapack_dependencies')
const lockfile_path = path.join(process.cwd(), '.sandstone/deployed_dependencies.lock')

let deployed: string[] = []
try {
    deployed = JSON.parse(await fs.promises.readFile(lockfile_path, 'utf8'))
} catch {}

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
        await dep_zip.addLocalFolderPromise(full_path, { zipPath: '/' })
        buffer = (await dep_zip.toBufferPromise()).buffer
    } else {
        continue
    }

    await upload_zip(buffer, dep_name)
    console.log(`Deployed: ${dep_name}`)
    deployed.push(dep_name)
}

await fs.promises.writeFile(lockfile_path, JSON.stringify(deployed))