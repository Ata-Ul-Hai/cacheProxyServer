import fs from 'fs/promises'
import path from 'path';

async function Cache(name, data){
    try {
        // const dir = await fs.mkdir('.cache', { recursive: true })
        await fs.writeFile(path.join('.cache', name), data, 'utf-8')
    } catch (error) {
        console.error('error creating cache:', error);
    }
}

async function ClearCache(){
    const dir = await fs.readdir('.cache', {withFileTypes: true});

    await Promise.all(
        dir.map((file) => {
            const fullPath = path.join('.cache', file.name);
            return file.isFile() && fs.unlink(fullPath)
        })
    )
}

async function Find(name){
    try {
        const data = await fs.readFile(path.join('.cache', name), 'utf-8')
        return data
    } catch (error) {
        return null
    }
}

export {Cache, ClearCache, Find}