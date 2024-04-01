import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "Authenticated as": "Authenticated as",
      Cancel: "Cancel",
      "Create identity": "Create identity",
      Identities: "Identities",
      Identity: "Identity",
      Ok: "Ok",
      Sign: "Sign",
      "Sign as": "Sign as",
      "Use another identity": "Use another identity",
      "wants-access": "wants to access your identity",
    },
  },
  "zh-CN": {
    translation: {
      "Authenticated as": "已验证为",
      Cancel: "取消",
      "Create identity": "创建身份",
      Identities: "身份",
      Identity: "身份",
      Ok: "确定",
      Sign: "签名",
      "Sign as": "以此身份签名",
      "Use another identity": "使用其他身份",
      "wants-access": "请求访问您的身份",
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
