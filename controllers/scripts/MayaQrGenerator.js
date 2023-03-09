const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const AdmZip = require("adm-zip");
const CryptoJS = require('crypto-js');

module.exports = async function MayaQrGenerator(gameId, scriptLinked) {
  console.log(scriptLinked, "linkedScript")

  // La fonction de cryptage
  function encrypt(data, secretKey) {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
  }

  // Chiffrer les informations en utilisant AES
  const secretKey = "f181dc300da38da8cc5e5fba34f06f2e"
  let qrNumber;
  if (scriptLinked === "MayaQrGenerator") {
    qrNumber = 4;
  }

  const dir = `images/${gameId}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const generateGameQrCodes = async (url, filePath) => {
    try {
      const qrImage = await qrcode.toFile(filePath, url);
      console.log(`QR code généré ${filePath}`);
    } catch (error) {
      console.error(error);
    }
  };

  const generateInfosQrCode = async (from) => {
    const data = `gameName=${gameId}&scriptLinked=${scriptLinked}&from=${from}`;
    const ciphertext = encrypt(data, secretKey);
    const encodedCiphertext = encodeURIComponent(ciphertext);
    const url = `${urlPrefix}?data=${encodedCiphertext}`;
    console.log(url);
    const filePath = `${dir}/qr-${from}.svg`;
    console.log(`Génération du QR Code ${from}`);
    await generateGameQrCodes(url, filePath);
  };

  const urlPrefix = `http://192.168.1.57:3001/qr-checker`;

  const generateGameQrPromises = [];
  for (let i = 1; i <= qrNumber; i++) {
    const data = `gameName=${gameId}&scriptLinked=${scriptLinked}&qrNumber=${i}`;
    const ciphertext = encrypt(data, secretKey);
    const encodedCiphertext = encodeURIComponent(ciphertext);
    const url = `${urlPrefix}?data=${encodedCiphertext}`;
    console.log(url);
    const filePath = `${dir}/qr-${i}.svg`;
    console.log("Génération d'un QR Code");
    generateGameQrPromises.push(generateGameQrCodes(url, filePath));
  }

  const generateDynamicQrPromises = [
    generateInfosQrCode('flyers'),
    generateInfosQrCode('affiche-1'),
    generateInfosQrCode('affiche-2'),
  ];

  await Promise.all([...generateGameQrPromises, ...generateDynamicQrPromises]).then(() => {
    createZipArchive();
  });

  async function createZipArchive() {
    try {
      const zip = new AdmZip();
      const outputFile = gameId + ".zip";
      const initial = path.resolve(__dirname, "../../", outputFile);
      const destination = path.resolve(__dirname, '../../images/' + gameId + "/" + gameId + ".zip");
      zip.addLocalFolder("./images/" + gameId);
      zip.writeZip(outputFile);
      console.log(`Création de ${outputFile} réussite`);
      fs.rename(initial, destination, function (err, data) {
        if (err) {
          console.log(err)
        } else {
          console.log("Zip Bougé dans le sous dossier d'images : " + gameId)
        }
      });
    } catch (e) {
      console.log(`Something went wrong. ${e}`);
    }
  }
};