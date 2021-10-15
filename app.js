const { Client, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const qrImage = require('qr-image');
const qrcode = require('qrcode-terminal');


const SESSION_FILE_PATH = './session.json';
let client;
let sessionData;

const withSession = () => {
    sessionData = require(SESSION_FILE_PATH);
    client = new Client({
        session: sessionData
    });

    client.on('ready', () => {
        console.log('Client is ready');
        listenMessage();
    });

    client.on('auth_failure', () => {
        console.log('** Error de autentificacion vuelve a generar el QRCODE **');
    });

    client.initialize();

}


/* This function generate qrcode */
const withOutSession = () => {
    console.log('No tenemos session guardada');
    client = new Client();
    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('Client is ready!');
        connectionReady();
    });

    client.on('auth_failure', () => {
        console.log('** Error de autentificacion vuelve a generar el QRCODE **');
    })


    client.on('authenticated', (session) => {
        // Guardamos credenciales de de session para usar luego
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.log(err);
            }
        });
    });

    client.initialize();
}

/* This function listen all time the mesaggess that arrive to your number */
const listenMessage =  () => {
    console.log('esta entrando');
    client.on('message', async(msg) => {
        const { from, to, body } = msg;
        switch (body) {
            case 'hola':
                sendMessage(from, 'Hola Estos son mensajes de prueba');
                break;
            case 'QR':
                const urlAproven = 'https://github.com/alejandropg339/VISITANTES-BACKEND/blob/dev/src/services/mailer.service.js';
                sendMessage(from, 'Mostrar este codigo para el ingreso');
                await createImage(urlAproven, from, 'qrGit.png');
                // if(firstImage){
                // }
                // sendMedia(from, 'qrPage.png');
                break;
        }

        console.log(from, to, body);
    });
}

const sendMessage = (to, message) => {

    client.sendMessage(to, message);
}

const sendMedia = (to, file) => {
    const mediaFile = MessageMedia.fromFilePath(`./images/${file}`);
    const direction = path.join(__dirname, `./images/${file}`);
    console.log(direction);
    client.sendMessage(to, mediaFile);
    deleteRecentFile(direction);
}

const deleteRecentFile = async (fileRoute) => {
    await fs.unlink(fileRoute, (err) => {
        if (err) {
            return err;
        } else {
            console.log('Deleting file');
            return true;
        }
    });
}

const createImage = async (url, from, file) => {
    console.log(file);
    var qr_png = qrImage.image(url, { type: 'png' });
    const createPic = await qr_png.pipe(fs.createWriteStream(`./images/${file}`));
    createPic.on('finish', () => {
        sendMedia(from, file);
    });
}

(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withOutSession();

// createImage('https://github.com/alejandropg339/VISITANTES-BACKEND/blob/dev/src/services/mailer.service.js', 'qrPage.png');