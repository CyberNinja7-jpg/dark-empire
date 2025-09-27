// Rahl XMD Bot
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'

async function startRahlXMD() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update
    if (qr) {
      qrcode.generate(qr, { small: true })
      console.log('📲 Scan the QR above with WhatsApp to link Rahl XMD')
    }
    if (connection === 'open') {
      console.log('✅ Rahl XMD is online!')
    }
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('❌ Connection closed. Code:', reason)
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // Basic command system
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0]
    if (!msg.message || msg.key.fromMe) return

    const sender = msg.key.remoteJid
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''

    console.log('📩', sender, text)

    if (text.toLowerCase() === 'ping') {
      await sock.sendMessage(sender, { text: 'pong 🏓 (Rahl XMD)' })
    } else if (text.toLowerCase().includes('hi')) {
      await sock.sendMessage(sender, { text: '👑 Greetings! I am Rahl XMD.' })
    } else if (text.toLowerCase().startsWith('!echo ')) {
      const echoMsg = text.slice(6)
      await sock.sendMessage(sender, { text: `🔊 ${echoMsg}` })
    }
  })
}

startRahlXMD()
