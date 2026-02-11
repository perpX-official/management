import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";

const privacyContent = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: January 21, 2026",
    sections: [
      {
        heading: "1. General Information",
        paragraphs: [
          'PerpX ("we", "our", "us") operates a decentralized perpetual trading platform. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.',
          "Protecting your personal data is very important to us. We are committed to transparency about our data practices and your privacy rights."
        ]
      },
      {
        heading: "2. Information We Collect",
        subsections: [
          {
            subheading: "Technical Data",
            content: "When you use our platform, we collect anonymized technical information including IP addresses, browser type, device information, and usage patterns. This data helps us ensure the functionality and security of our services."
          },
          {
            subheading: "Wallet Information",
            content: "We collect your blockchain wallet address and transaction history when you interact with our smart contracts. This information is necessary to provide trading services and is recorded on the public blockchain."
          },
          {
            subheading: "Communication Data",
            content: "When you contact us through support channels, we collect the information you provide including your contact details and the content of your communications."
          }
        ]
      },
      {
        heading: "3. How We Use Your Information",
        intro: "We use the collected information to:",
        list: [
          "Provide and maintain our trading platform",
          "Process your transactions and trading activities",
          "Improve our services and user experience",
          "Ensure platform security and prevent fraud",
          "Comply with legal obligations and regulations",
          "Communicate with you about service updates"
        ]
      },
      {
        heading: "4. Legal Basis for Processing",
        intro: "We process your personal data based on:",
        list: [
          "Performance of contract with you",
          "Compliance with legal obligations",
          "Our legitimate interests in operating and improving the platform",
          "Your consent, where applicable"
        ]
      },
      {
        heading: "5. Data Sharing and Disclosure",
        intro: "We do not sell your personal information. We may share your data with:",
        list: [
          "Service providers who assist in operating our platform",
          "Legal authorities when required by law",
          "Professional advisors such as lawyers and auditors",
          "Third parties in connection with business transfers"
        ]
      },
      {
        heading: "6. Data Security",
        paragraphs: [
          "We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security."
        ]
      },
      {
        heading: "7. Data Retention",
        paragraphs: [
          "We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements."
        ]
      },
      {
        heading: "8. Your Rights",
        intro: "Depending on your jurisdiction, you may have the following rights:",
        list: [
          "Right to access your personal data",
          "Right to rectification of inaccurate data",
          "Right to erasure of your data",
          "Right to restriction of processing",
          "Right to data portability",
          "Right to object to processing",
          "Right to withdraw consent"
        ]
      },
      {
        heading: "9. Cookies and Tracking",
        paragraphs: [
          "We use cookies and similar tracking technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences."
        ]
      },
      {
        heading: "10. International Data Transfers",
        paragraphs: [
          "Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws."
        ]
      },
      {
        heading: "11. Children's Privacy",
        paragraphs: [
          "Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children."
        ]
      },
      {
        heading: "12. Changes to This Privacy Policy",
        paragraphs: [
          'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.'
        ]
      },
      {
        heading: "13. Contact Us",
        paragraphs: [
          "If you have any questions about this Privacy Policy or our data practices, please contact us at:",
          "Email: privacy@perpx.exchange"
        ]
      }
    ]
  },
  jp: {
    title: "プライバシーポリシー",
    lastUpdated: "最終更新日：2026年1月21日",
    sections: [
      {
        heading: "1. 一般情報",
        paragraphs: [
          "PerpX（「当社」）は、分散型パーペチュアル取引プラットフォームを運営しています。本プライバシーポリシーは、お客様が当社のサービスを利用する際に、当社がどのように個人情報を収集、使用、保護するかを説明します。",
          "お客様の個人データの保護は当社にとって非常に重要です。当社はデータ慣行とお客様のプライバシー権について透明性を保つことをお約束します。"
        ]
      },
      {
        heading: "2. 収集する情報",
        subsections: [
          {
            subheading: "技術データ",
            content: "お客様が当社のプラットフォームを使用する際、IPアドレス、ブラウザの種類、デバイス情報、使用パターンを含む匿名化された技術情報を収集します。このデータは、当社のサービスの機能性とセキュリティを確保するために役立ちます。"
          },
          {
            subheading: "ウォレット情報",
            content: "お客様が当社のスマートコントラクトとやり取りする際、ブロックチェーンウォレットアドレスと取引履歴を収集します。この情報は取引サービスを提供するために必要であり、パブリックブロックチェーンに記録されます。"
          },
          {
            subheading: "通信データ",
            content: "お客様がサポートチャネルを通じて当社に連絡する際、連絡先の詳細や通信内容を含む、お客様が提供する情報を収集します。"
          }
        ]
      },
      {
        heading: "3. 情報の使用方法",
        intro: "収集した情報は以下の目的で使用します：",
        list: [
          "取引プラットフォームの提供と維持",
          "取引および取引活動の処理",
          "サービスとユーザーエクスペリエンスの改善",
          "プラットフォームのセキュリティ確保と詐欺防止",
          "法的義務と規制の遵守",
          "サービスの更新に関する連絡"
        ]
      },
      {
        heading: "4. 処理の法的根拠",
        intro: "当社は以下に基づいてお客様の個人データを処理します：",
        list: [
          "お客様との契約の履行",
          "法的義務の遵守",
          "プラットフォームの運営と改善における当社の正当な利益",
          "該当する場合、お客様の同意"
        ]
      },
      {
        heading: "5. データの共有と開示",
        intro: "当社はお客様の個人情報を販売しません。以下の場合にデータを共有することがあります：",
        list: [
          "プラットフォームの運営を支援するサービスプロバイダー",
          "法律で義務付けられている場合の法的機関",
          "弁護士や監査人などの専門アドバイザー",
          "事業譲渡に関連する第三者"
        ]
      },
      {
        heading: "6. データセキュリティ",
        paragraphs: [
          "当社は、お客様の個人データを不正アクセス、改ざん、開示、破壊から保護するために、適切な技術的および組織的セキュリティ対策を実施しています。ただし、インターネット上の伝送方法は100%安全ではなく、絶対的なセキュリティを保証することはできません。"
        ]
      },
      {
        heading: "7. データ保持",
        paragraphs: [
          "当社は、本プライバシーポリシーに記載された目的を達成するため、法的義務を遵守するため、紛争を解決するため、および契約を執行するために必要な期間のみ、お客様の個人データを保持します。"
        ]
      },
      {
        heading: "8. お客様の権利",
        intro: "お客様の管轄区域によっては、以下の権利を有する場合があります：",
        list: [
          "個人データへのアクセス権",
          "不正確なデータの訂正権",
          "データの消去権",
          "処理の制限権",
          "データポータビリティの権利",
          "処理への異議申し立て権",
          "同意の撤回権"
        ]
      },
      {
        heading: "9. クッキーとトラッキング",
        paragraphs: [
          "当社は、プラットフォームでのお客様の体験を向上させるために、クッキーおよび類似のトラッキング技術を使用します。ブラウザの設定でクッキーの設定を管理できます。"
        ]
      },
      {
        heading: "10. 国際データ転送",
        paragraphs: [
          "お客様の情報は、お客様の居住国以外の国に転送され、処理される場合があります。当社は、適用されるデータ保護法に従ってお客様のデータを保護するための適切な保護措置が講じられていることを保証します。"
        ]
      },
      {
        heading: "11. 子供のプライバシー",
        paragraphs: [
          "当社のサービスは18歳未満の個人を対象としていません。当社は故意に子供から個人情報を収集しません。"
        ]
      },
      {
        heading: "12. 本プライバシーポリシーの変更",
        paragraphs: [
          "当社は本プライバシーポリシーを随時更新することがあります。変更がある場合は、このページに新しいプライバシーポリシーを掲載し、「最終更新日」を更新することでお知らせします。"
        ]
      },
      {
        heading: "13. お問い合わせ",
        paragraphs: [
          "本プライバシーポリシーまたは当社のデータ慣行について質問がある場合は、以下までご連絡ください：",
          "メール：privacy@perpx.exchange"
        ]
      }
    ]
  },
  cn: {
    title: "隐私政策",
    lastUpdated: "最后更新：2026年1月21日",
    sections: [
      {
        heading: "1. 一般信息",
        paragraphs: [
          "PerpX（\"我们\"）运营一个去中心化永续交易平台。本隐私政策说明我们在您使用我们的服务时如何收集、使用和保护您的个人信息。",
          "保护您的个人数据对我们非常重要。我们承诺对我们的数据实践和您的隐私权保持透明。"
        ]
      },
      {
        heading: "2. 我们收集的信息",
        subsections: [
          {
            subheading: "技术数据",
            content: "当您使用我们的平台时，我们收集包括IP地址、浏览器类型、设备信息和使用模式在内的匿名技术信息。这些数据帮助我们确保服务的功能性和安全性。"
          },
          {
            subheading: "钱包信息",
            content: "当您与我们的智能合约交互时，我们收集您的区块链钱包地址和交易历史。这些信息是提供交易服务所必需的，并记录在公共区块链上。"
          },
          {
            subheading: "通信数据",
            content: "当您通过支持渠道联系我们时，我们收集您提供的信息，包括您的联系方式和通信内容。"
          }
        ]
      },
      {
        heading: "3. 我们如何使用您的信息",
        intro: "我们使用收集的信息来：",
        list: [
          "提供和维护我们的交易平台",
          "处理您的交易和交易活动",
          "改进我们的服务和用户体验",
          "确保平台安全并防止欺诈",
          "遵守法律义务和法规",
          "就服务更新与您沟通"
        ]
      },
      {
        heading: "4. 处理的法律依据",
        intro: "我们基于以下依据处理您的个人数据：",
        list: [
          "与您的合同履行",
          "遵守法律义务",
          "我们在运营和改进平台方面的合法利益",
          "您的同意（如适用）"
        ]
      },
      {
        heading: "5. 数据共享和披露",
        intro: "我们不出售您的个人信息。我们可能与以下方共享您的数据：",
        list: [
          "协助运营我们平台的服务提供商",
          "法律要求时的法律机构",
          "律师和审计师等专业顾问",
          "与业务转让相关的第三方"
        ]
      },
      {
        heading: "6. 数据安全",
        paragraphs: [
          "我们实施适当的技术和组织安全措施，以保护您的个人数据免遭未经授权的访问、更改、披露或破坏。但是，通过互联网传输的方法都不是100%安全的，我们无法保证绝对安全。"
        ]
      },
      {
        heading: "7. 数据保留",
        paragraphs: [
          "我们仅在必要的时间内保留您的个人数据，以实现本隐私政策中概述的目的、遵守法律义务、解决争议和执行我们的协议。"
        ]
      },
      {
        heading: "8. 您的权利",
        intro: "根据您所在的司法管辖区，您可能拥有以下权利：",
        list: [
          "访问您的个人数据的权利",
          "更正不准确数据的权利",
          "删除您的数据的权利",
          "限制处理的权利",
          "数据可携带性的权利",
          "反对处理的权利",
          "撤回同意的权利"
        ]
      },
      {
        heading: "9. Cookie和跟踪",
        paragraphs: [
          "我们使用Cookie和类似的跟踪技术来增强您在我们平台上的体验。您可以通过浏览器首选项控制Cookie设置。"
        ]
      },
      {
        heading: "10. 国际数据传输",
        paragraphs: [
          "您的信息可能会被传输到您居住国以外的国家并在那里进行处理。我们确保采取适当的保障措施，以根据适用的数据保护法保护您的数据。"
        ]
      },
      {
        heading: "11. 儿童隐私",
        paragraphs: [
          "我们的服务不适用于18岁以下的个人。我们不会故意收集儿童的个人信息。"
        ]
      },
      {
        heading: "12. 本隐私政策的变更",
        paragraphs: [
          "我们可能会不时更新本隐私政策。我们将通过在此页面上发布新的隐私政策并更新\"最后更新\"日期来通知您任何更改。"
        ]
      },
      {
        heading: "13. 联系我们",
        paragraphs: [
          "如果您对本隐私政策或我们的数据实践有任何疑问，请通过以下方式联系我们：",
          "电子邮件：privacy@perpx.exchange"
        ]
      }
    ]
  }
};

export default function PrivacyPolicy() {
  const { language } = useLanguage();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const content = privacyContent[language as keyof typeof privacyContent] || privacyContent.en;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">{content.title}</h1>
        <p className="text-sm text-white/60 mb-8">{content.lastUpdated}</p>

        <div className="space-y-8 text-white/80">
          {content.sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-2xl font-bold text-white mb-4">{section.heading}</h2>
              
              {section.paragraphs && section.paragraphs.map((para, pIndex) => (
                <p key={pIndex} className={pIndex < (section.paragraphs?.length || 0) - 1 ? "mb-4" : ""}>
                  {para}
                </p>
              ))}

              {section.subsections && section.subsections.map((sub, sIndex) => (
                <div key={sIndex} className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-3">{sub.subheading}</h3>
                  <p className="mb-4">{sub.content}</p>
                </div>
              ))}

              {section.intro && (
                <>
                  <p className="mb-4">{section.intro}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    {section.list?.map((item, lIndex) => (
                      <li key={lIndex}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

