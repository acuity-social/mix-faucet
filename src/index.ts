import Web3 from 'web3'
import fs from 'fs'
import net from 'net'
import levelup from 'levelup'
import leveldown from 'leveldown'
import cors from 'cors'
import express from 'express'
import * as bip32 from 'bip32'
import { BIP32Interface } from 'bip32'
import * as bip39  from 'bip39'
let ethTx = require('ethereumjs-tx')


async function start() {
	let parityIpcPath = process.env['HOME'] + '/.local/share/io.parity.ethereum/jsonrpc.ipc'
	let web3 = new Web3(new Web3.providers.IpcProvider(parityIpcPath, net))

	let blockNumber = await web3.eth.getBlockNumber()
	console.log('Block: ' + blockNumber.toLocaleString())

	let dbPath = process.env['HOME'] + '/.faucet.db'
	console.log('Initializing database: ' + dbPath)
	var db = levelup(leveldown(dbPath))

	let app = express()
  app.set('trust proxy', '127.0.0.1')
	app.use(cors())
	let port = 3000

	// Calculate private key and controller address.
	let recoveryPhrase = fs.readFileSync(process.env['HOME'] + '/.faucet.phrase').toString().trim()
	let node: BIP32Interface = bip32.fromSeed(await bip39.mnemonicToSeed(recoveryPhrase))
	let privateKey: Buffer = node.derivePath("m/44'/76'/0'/0/0").privateKey!
	let from: string = web3.eth.accounts.privateKeyToAccount(privateKey).address

	console.log(from)

	app.get('/:address', async (req, res) => {
		let ip = req.ip
		let timestamp:number = 0
		let now = Date.now()
		try {
			timestamp = parseInt((await db.get(ip)).toString())
		}
		catch (e) {}
		if (now - timestamp > 1000 * 60 * 60 * 24) {
			let to = req.params.address
			if (!web3.utils.isAddress(to)) {
				res.status(403).send('Invalid MIX address.')
			}
			else {
				let rawTx = {
					nonce: await web3.eth.getTransactionCount(from),
					from: from,
					to: to,
					gas: 21000,
					gasPrice: '0x3b9aca00',
					value: web3.utils.toHex(web3.utils.toWei('1')),
				}
				let tx = new ethTx(rawTx)
				tx.sign(privateKey)
				let serializedTx = tx.serialize()
				web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
				.on('transactionHash', async transactionHash => {
					res.send('MIX sent.')
					db.put(ip, Buffer.from(now.toString()))
					console.log(transactionHash)
				})
				.on('receipt', console.log)
				.on('error', error => {
					res.status(403).send('Failed to send MIX.')
					console.error(error)
				})
			}
		}
		else {
			res.status(403).send('This IP address has already received MIX in the last 24 hours.')
		}
	})

	app.listen(port, () => console.log(`MIX Faucet listening on port ${port}!`))
}

start()
