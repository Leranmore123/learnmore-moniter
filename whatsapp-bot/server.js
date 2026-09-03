const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5002;
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

let sock = null;
let latestQrString = null;
let latestQrDataUrl = null;
let pairingCode = null;
let botStatus = {
  isConnected: false,
  phoneNumber: null,
  userName: null,
  status: 'initializing',
  lastConnectedAt: null,
};

// Start or restart WhatsApp Socket
async function startWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      auth: state,
      browser: ['TrainerMonitor Server', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        latestQrString = qr;
        try {
          latestQrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
        } catch (e) {
          console.error('QR Render Error:', e);
        }
        botStatus.status = 'scan_required';
        botStatus.isConnected = false;
        console.log('⚡ New Official WhatsApp Web QR Generated. Ready for scan.');
      }

      if (connection === 'close') {
        const isLoggedOut =
          lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut ||
          lastDisconnect?.error?.output?.statusCode === 401;
        botStatus.isConnected = false;
        botStatus.status = 'disconnected';
        console.log('Connection closed due to', lastDisconnect?.error, ', isLoggedOut:', isLoggedOut);

        if (isLoggedOut) {
          console.log('⚠️ Old session expired or unlinked. Clearing auth folder to generate fresh QR code...');
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
          setTimeout(startWhatsApp, 1500);
        } else {
          setTimeout(startWhatsApp, 3000);
        }
      } else if (connection === 'open') {
        latestQrString = null;
        latestQrDataUrl = null;
        botStatus.isConnected = true;
        botStatus.status = 'connected';
        botStatus.phoneNumber = sock?.user?.id ? sock.user.id.split(':')[0] : 'Linked';
        botStatus.userName = sock?.user?.name || 'Admin';
        botStatus.lastConnectedAt = new Date().toISOString();
        console.log('✅ WhatsApp Socket Connected Successfully! User:', sock.user);
      }
    });

    sock.ev.on('messages.upsert', async (m) => {
      // Optional message listener
    });
  } catch (err) {
    console.error('Error starting WhatsApp socket:', err);
    setTimeout(startWhatsApp, 5000);
  }
}

// Start WhatsApp socket on boot
startWhatsApp();

// Lightweight HTTP API for Next.js
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Helper to parse JSON body
  const getBody = () =>
    new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'));
        } catch {
          resolve({});
        }
      });
    });

  // GET /status
  if (req.method === 'GET' && url.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(
      JSON.stringify({
        success: true,
        bot: {
          ...botStatus,
          hasQr: !!latestQrDataUrl,
          qrDataUrl: latestQrDataUrl,
          pairingCode,
        },
      })
    );
  }

  // GET /groups (List all groups in user's WhatsApp)
  if (req.method === 'GET' && url.pathname === '/groups') {
    if (!botStatus.isConnected || !sock) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, groups: [] }));
    }

    try {
      const groupData = await sock.groupFetchAllParticipating();
      const groups = Object.values(groupData).map((g) => ({
        id: g.id,
        name: g.subject,
        size: g.participants?.length || 0,
        creation: g.creation,
        owner: g.owner,
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, groups }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message, groups: [] }));
    }
  }

  // POST /pair-code (for pairing code method)
  if (req.method === 'POST' && url.pathname === '/pair-code') {
    const body = await getBody();
    const phone = (body.phone || '').replace(/[^0-9]/g, '');
    if (!phone) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Phone number required' }));
    }

    try {
      if (sock && !sock.authState.creds.registered) {
        pairingCode = await sock.requestPairingCode(phone);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, pairingCode }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Already registered or socket not ready' }));
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // POST /create-group
  if (req.method === 'POST' && url.pathname === '/create-group') {
    const body = await getBody();
    const { name, participants = [] } = body;

    if (!botStatus.isConnected || !sock) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          success: false,
          error: 'WhatsApp Bot is not connected yet. Please scan QR code first.',
        })
      );
    }

    try {
      // Format phone numbers to standard WhatsApp JIDs
      const jids = participants
        .map((p) => {
          if (!p) return null;
          let clean = String(p).replace(/[^0-9]/g, '');
          if (!clean || clean.length < 10) return null;
          if (clean.length === 10) clean = '91' + clean;
          if (clean.length === 11 && clean.startsWith('0')) clean = '91' + clean.slice(1);
          return `${clean}@s.whatsapp.net`;
        })
        .filter(Boolean);

      // If no participants were provided, use bot user JID as fallback so groupCreate never fails
      if (jids.length === 0 && sock?.user?.id) {
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        jids.push(botJid);
      }

      console.log(`Creating group "${name}" with ${jids.length} participants:`, jids);
      let group;
      try {
        group = await sock.groupCreate(name || 'New Batch Group', jids);
      } catch (createErr) {
        console.log('groupCreate with full participant list failed, retrying with bot JID:', createErr.message);
        const botJid = sock.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : null;
        group = await sock.groupCreate(name || 'New Batch Group', botJid ? [botJid] : []);
      }
      
      // Ensure all participants are added
      if (jids.length > 0) {
        try {
          await sock.groupParticipantsUpdate(group.id, jids, 'add');
        } catch (addErr) {
          console.log('Group participants add note:', addErr.message);
        }
      }

      let inviteCode = '';
      try {
        inviteCode = await sock.groupInviteCode(group.id);
      } catch {
        // silent
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          success: true,
          groupId: group.id,
          groupName: name,
          inviteLink: inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : null,
        })
      );
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // POST /send-message
  if (req.method === 'POST' && url.pathname === '/send-message') {
    const body = await getBody();
    const { target, text, withLogo = false } = body;

    if (!botStatus.isConnected || !sock) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          success: false,
          error: 'WhatsApp Bot is not connected yet. Please scan QR code first.',
        })
      );
    }

    try {
      let jid = target;
      if (!jid.includes('@')) {
        const clean = target.replace(/[^0-9]/g, '');
        jid = `${clean}@s.whatsapp.net`;
      }

      // Pure clean text message without any image/logo attachment
      const result = await sock.sendMessage(jid, { text });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, result }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // POST /reset-auth (Wipe session to generate new official QR Code)
  if ((req.method === 'POST' || req.method === 'GET') && url.pathname === '/reset-auth') {
    try {
      console.log('🔄 Manual /reset-auth requested. Clearing old session for new QR code...');
      if (sock) {
        try { sock.end(); } catch {}
      }
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      botStatus = {
        isConnected: false,
        phoneNumber: null,
        userName: null,
        status: 'initializing',
        lastConnectedAt: null,
      };
      latestQrDataUrl = null;
      latestQrString = null;
      setTimeout(startWhatsApp, 1000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Session reset. Generating fresh official QR code...' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Real WhatsApp Baileys Gateway Server running at http://localhost:${PORT}`);
});
