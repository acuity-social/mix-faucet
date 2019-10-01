import Web3 from 'web3'
import net from 'net'
import levelup from 'levelup'
import leveldown from 'leveldown'
import express from 'express'


async function start() {
	let parityIpcPath = process.env['HOME'] + '/.config/MIX Acuity/parity.ipc'
//	let parityIpcPath = process.env['HOME'] + '/.local/share/io.parity.ethereum/jsonrpc.ipc'
	let web3 = new Web3(new Web3.providers.IpcProvider(parityIpcPath, net))

	let blockNumber = await web3.eth.getBlockNumber()
	console.log('Block: ' + blockNumber.toLocaleString())

	let dbPath = process.env['HOME'] + '/.faucet.db'
	console.log('Initializing database: ' + dbPath)
	var db = levelup(leveldown(dbPath))

	let app = express()
	let port = 3000

	app.get('/:address', async (req, res) => {
		let ip = req.ip
		let timestamp:number = 0
		let now = Date.now()
		try {
			timestamp = parseInt((await db.get(ip)).toString())
		}
		catch (e) {}
		if (now - timestamp > 1000 * 60 * 60 * 24) {
			console.log('Success!')
			db.put(ip, Buffer.from(now.toString()))
		}
		else {
			console.log('Failure!')
		}
		console.log(req.params.address)
		res.send('Hello World!')
	})

	app.listen(port, () => console.log(`MIX Faucet listening on port ${port}!`))
}

start()
