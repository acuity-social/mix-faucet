import Web3 from 'web3'
import net from 'net'
import express from 'express'

let ipcPath = '~/.local/share/io.parity.ethereum/jsonrpc.ipc'
let web3 = new Web3(new Web3.providers.IpcProvider(ipcPath, net))

let app = express()
let port = 3000

async function start() {
	let parityIpcPath = process.env['HOME'] + '/.config/MIX Acuity/parity.ipc'
//	let parityIpcPath = process.env['HOME'] + '/.local/share/io.parity.ethereum/jsonrpc.ipc'
	let web3 = new Web3(new Web3.providers.IpcProvider(parityIpcPath, net))

	let blockNumber = await web3.eth.getBlockNumber()
	console.log('Block: ' + blockNumber.toLocaleString())

	app.get('/:address', (req, res) => {
		console.log(req.params.address)
		res.send('Hello World!')
	})

	app.listen(port, () => console.log(`MIX Faucet listening on port ${port}!`))
}

start()
