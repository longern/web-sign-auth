import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "Authenticated as": "Authenticated as",
      Cancel: "Cancel",
      "Create identity": "Create identity",
      Delete: "Delete",
      "Delete identity": "Delete identity",
      Edit: "Edit",
      Fingerprint: "Fingerprint",
      Identities: "Identities",
      Identity: "Identity",
      "Identity created!": "Identity created!",
      Name: "Name",
      Ok: "Ok",
      "Private key": "Private key",
      "Public key": "Public key",
      Save: "Save",
      Sign: "Sign",
      "Sign as": "Sign as",
      "Try it": "Try it",
      "Use another identity": "Use another identity",

      canSign: "Now you can sign as the identities created on this device.",
      noIdentities: "No identities found on this device.",
      wantsAccess: "wants to access your identity",
    },
  },
  "zh-CN": {
    translation: {
      "Authenticated as": "已验证为",
      Cancel: "取消",
      "Create identity": "创建身份",
      Delete: "删除",
      "Delete identity": "删除身份",
      Edit: "编辑",
      Fingerprint: "指纹",
      Identities: "身份",
      Identity: "身份",
      "Identity created!": "身份已创建！",
      Name: "名称",
      Ok: "确定",
      "Private key": "私钥",
      "Public key": "公钥",
      Save: "保存",
      Sign: "签名",
      "Sign as": "以此身份签名",
      "Try it": "试一试",
      "Use another identity": "使用其他身份",

      canSign: "现在您可以使用此设备上创建的身份进行签名。",
      noIdentities: "此设备上未找到任何身份。",
      wantsAccess: "请求访问您的身份",
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
