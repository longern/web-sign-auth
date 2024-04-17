import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "Authenticated as": "Authenticated as",
      "Authentication failed": "Authentication failed",
      Back: "Back",
      Cancel: "Cancel",
      "Copy to clipboard": "Copy to clipboard",
      "Create identity": "Create identity",
      Delete: "Delete",
      "Delete identity": "Delete identity",
      Edit: "Edit",
      ID: "ID",
      "ID prefix": "ID prefix",
      "Identities you created": "Identities you created",
      Identity: "Identity",
      "Identity created!": "Identity created!",
      Import: "Import",
      "Import existing identity": "Import existing identity",
      Mnemonic: "Mnemonic",
      Name: "Name",
      Ok: "Ok",
      "Private key": "Private key",
      "Public key": "Public key",
      "QR code": "QR code",
      Save: "Save",
      "Show private key": "Show private key",
      Sign: "Sign",
      "Sign as": "Sign as",
      "Try it": "Try it",
      "Try remote identity": "Try remote identity",
      "Use another device": "Use another device",
      "Use another identity": "Use another identity",
      "Your identity": "Your identity",

      aboutToSign: "You are about to sign the agreement:",
      beforeCreating: "Before you create an identity, please note that:",
      canSign: "Now you can sign as the identities created on this device.",
      confirmDelete: "Are you sure you want to delete this identity?",
      doNotShare:
        "Do not share your private key with anyone. Whoever has your private key can permanently control your account.",
      grantAccessIdentity: "Grant this origin access to your identity",
      identitiesNotFound:
        "No identities found on this device. You can create identities on this device or sign using identities stored on other devices.",
      identityHelpText:
        "You can create an identity on this device and use it to sign. The server will verify your signature using asymmetric encryption algorithms. The private key will be stored on this device and will not be uploaded to the server.",
      operateOnAnotherDevice: "Please operate on another device.",
      pastePrivateKey: "Paste your base64-encoded private key here.",
      properlyStore:
        "Properly store your private key. Once lost, it can never be recovered.",
      scanQRCodeToSign:
        "Scan the QR code below with your other device to sign.",
    },
  },
  "zh-CN": {
    translation: {
      "Authenticated as": "已认证为",
      "Authentication failed": "认证失败",
      Back: "返回",
      Cancel: "取消",
      "Copy to clipboard": "复制到剪贴板",
      "Create identity": "创建身份",
      Delete: "删除",
      "Delete identity": "删除身份",
      Edit: "编辑",
      ID: "ID",
      "ID prefix": "ID前缀",
      "Identities you created": "您创建的身份",
      Identity: "身份",
      "Identity created!": "身份已创建！",
      Import: "导入",
      "Import existing identity": "导入现有身份",
      Mnemonic: "助记词",
      Name: "名称",
      Ok: "确定",
      "Private key": "私钥",
      "Public key": "公钥",
      "QR code": "二维码",
      Save: "保存",
      "Show private key": "显示私钥",
      Sign: "签名",
      "Sign as": "以此身份签名",
      "Try it": "试一试",
      "Try remote identity": "尝试远程身份",
      "Use another device": "使用其他设备",
      "Use another identity": "使用其他身份",
      "Your identity": "您的身份",

      aboutToSign: "您即将签名同意：",
      beforeCreating: "在创建身份之前，请注意：",
      canSign: "现在您可以使用此设备上创建的身份进行签名。",
      confirmDelete: "您确定要删除此身份吗？",
      doNotShare:
        "不要与任何人分享您的私钥。拥有您的私钥的人可以永久获得您账户的控制权。",
      grantAccessIdentity: "授权此源访问您的身份",
      identitiesNotFound:
        "此设备上未找到任何身份。您可以在此设备上创建身份，也可以使用其他设备上存储的身份进行签名。",
      identityHelpText:
        "您可以在此设备上创建一个身份，然后使用它来签名，服务端将使用非对称加密算法验证您的签名。私钥将存储在此设备上，不会上传到服务器。",
      operateOnAnotherDevice: "请在另一台设备上操作。",
      pastePrivateKey: "在此处粘贴您的私钥（base64 编码）。",
      properlyStore: "妥善保管您的私钥。一旦丢失，将永远无法找回。",
      scanQRCodeToSign: "使用您的其他设备扫描下面的二维码进行签名。",
    },
  },
};

i18n
  .use(initReactI18next)
  .use({
    type: "languageDetector",
    async: true,
    detect: (cb: (lang: string) => void) => cb(window.navigator.language),
    init: () => {},
    cacheUserLanguage: () => {},
  })
  .init({
    resources,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
