import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";

const termsContent = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: January 21, 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        paragraphs: [
          "By accessing or using PerpX (\"the Platform\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree to these Terms, you must not access or use the Platform.",
          "These Terms constitute a legally binding agreement between you and PerpX. Please read them carefully."
        ]
      },
      {
        heading: "2. Eligibility and Restrictions",
        paragraphs: [
          "You must be at least 18 years old to use the Platform. By using the Platform, you represent and warrant that you meet this age requirement.",
          "The Platform is not available to persons or entities in certain restricted jurisdictions. You may not use the Platform if you are located in, or a citizen or resident of, any jurisdiction where such use would be illegal or prohibited.",
          "You may not use any technology or mechanism (such as VPNs) to circumvent geographic restrictions."
        ]
      },
      {
        heading: "3. Description of Services",
        intro: "PerpX provides a decentralized platform for perpetual contract trading. The Platform allows users to:",
        list: [
          "Trade perpetual contracts with leverage",
          "Access real-time market data and trading tools",
          "Manage trading positions and portfolios",
          "Participate in rewards and referral programs"
        ]
      },
      {
        heading: "4. User Responsibilities",
        intro: "You agree to:",
        list: [
          "Provide accurate and complete information",
          "Maintain the security of your wallet and private keys",
          "Comply with all applicable laws and regulations",
          "Not engage in market manipulation or fraudulent activities",
          "Not use the Platform for money laundering or terrorist financing",
          "Not interfere with the Platform's operation or security"
        ]
      },
      {
        heading: "5. Trading Risks",
        intro: "Trading perpetual contracts involves significant risk of loss. You acknowledge and accept that:",
        list: [
          "You may lose all or more than your initial investment",
          "Leverage amplifies both gains and losses",
          "Market volatility can result in rapid and substantial losses",
          "Past performance does not guarantee future results",
          "You are solely responsible for your trading decisions"
        ]
      },
      {
        heading: "6. Fees and Charges",
        paragraphs: [
          "The Platform may charge fees for trading and other services. All applicable fees will be disclosed to you before you complete a transaction. Fees are subject to change at our discretion."
        ]
      },
      {
        heading: "7. Intellectual Property",
        paragraphs: [
          "All content, features, and functionality of the Platform are owned by PerpX and are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express permission."
        ]
      },
      {
        heading: "8. Disclaimers",
        intro: "THE PLATFORM IS PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:",
        list: [
          "Warranties of merchantability and fitness for a particular purpose",
          "Warranties regarding accuracy, reliability, or availability",
          "Warranties that the Platform will be uninterrupted or error-free"
        ]
      },
      {
        heading: "9. Limitation of Liability",
        intro: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, PERPX SHALL NOT BE LIABLE FOR:",
        list: [
          "Any indirect, incidental, special, or consequential damages",
          "Loss of profits, revenue, data, or business opportunities",
          "Trading losses or liquidations",
          "Damages resulting from unauthorized access to your account",
          "Damages caused by third-party services or blockchain networks"
        ]
      },
      {
        heading: "10. Indemnification",
        paragraphs: [
          "You agree to indemnify and hold harmless PerpX and its affiliates from any claims, damages, losses, or expenses arising from your use of the Platform, violation of these Terms, or violation of any rights of third parties."
        ]
      },
      {
        heading: "11. Modifications to Terms",
        paragraphs: [
          "We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the Platform. Your continued use after such changes constitutes acceptance of the modified Terms."
        ]
      },
      {
        heading: "12. Termination",
        paragraphs: [
          "We may suspend or terminate your access to the Platform at any time, with or without cause or notice. You may stop using the Platform at any time."
        ]
      },
      {
        heading: "13. Dispute Resolution",
        paragraphs: [
          "Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration, except where prohibited by law.",
          "You waive any right to participate in class action lawsuits or class-wide arbitration."
        ]
      },
      {
        heading: "14. Governing Law",
        paragraphs: [
          "These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles."
        ]
      },
      {
        heading: "15. Severability",
        paragraphs: [
          "If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect."
        ]
      },
      {
        heading: "16. Contact Information",
        paragraphs: [
          "If you have questions about these Terms, please contact us at:",
          "Email: legal@perpx.exchange"
        ]
      }
    ]
  },
  jp: {
    title: "利用規約",
    lastUpdated: "最終更新日：2026年1月21日",
    sections: [
      {
        heading: "1. 規約の承諾",
        paragraphs: [
          "PerpX（\"プラットフォーム\"）にアクセスまたは使用することにより、お客様は本利用規約（\"規約\"）に拘束されることに同意します。本規約に同意しない場合は、プラットフォームにアクセスまたは使用してはなりません。",
          "本規約は、お客様とPerpXとの間の法的拘束力のある契約を構成します。注意深くお読みください。"
        ]
      },
      {
        heading: "2. 適格性と制限",
        paragraphs: [
          "プラットフォームを使用するには、少なくとも18歳以上である必要があります。プラットフォームを使用することにより、お客様はこの年齢要件を満たしていることを表明し保証します。",
          "プラットフォームは、特定の制限された管轄区域の個人または団体は利用できません。そのような使用が違法または禁止されている管轄区域に所在する、またはその市民もしくは居住者である場合、プラットフォームを使用することはできません。",
          "地理的制限を回避するために、技術やメカニズム（VPNなど）を使用することはできません。"
        ]
      },
      {
        heading: "3. サービスの説明",
        intro: "PerpXは、パーペチュアル契約取引のための分散型プラットフォームを提供します。プラットフォームでは、ユーザーは次のことができます：",
        list: [
          "レバレッジを使用したパーペチュアル契約の取引",
          "リアルタイムの市場データと取引ツールへのアクセス",
          "取引ポジションとポートフォリオの管理",
          "リワードと紹介プログラムへの参加"
        ]
      },
      {
        heading: "4. ユーザーの責任",
        intro: "お客様は以下に同意します：",
        list: [
          "正確かつ完全な情報を提供すること",
          "ウォレットと秘密鍵のセキュリティを維持すること",
          "適用されるすべての法律と規制を遵守すること",
          "市場操作や詐欺行為に従事しないこと",
          "マネーロンダリングやテロ資金供与のためにプラットフォームを使用しないこと",
          "プラットフォームの運営やセキュリティを妨害しないこと"
        ]
      },
      {
        heading: "5. 取引リスク",
        intro: "パーペチュアル契約の取引には重大な損失リスクが伴います。お客様は以下を認識し受け入れます：",
        list: [
          "初期投資のすべてまたはそれ以上を失う可能性があること",
          "レバレッジは利益と損失の両方を増幅すること",
          "市場のボラティリティは急速かつ実質的な損失をもたらす可能性があること",
          "過去のパフォーマンスは将来の結果を保証しないこと",
          "取引の決定についてはお客様が単独で責任を負うこと"
        ]
      },
      {
        heading: "6. 手数料と料金",
        paragraphs: [
          "プラットフォームは、取引やその他のサービスに対して手数料を請求する場合があります。適用されるすべての手数料は、取引を完了する前にお客様に開示されます。手数料は当社の裁量で変更される場合があります。"
        ]
      },
      {
        heading: "7. 知的財産",
        paragraphs: [
          "プラットフォームのすべてのコンテンツ、機能、および機能性はPerpXが所有し、知的財産法によって保護されています。当社の明示的な許可なしに、コピー、変更、配布、または派生物を作成することはできません。"
        ]
      },
      {
        heading: "8. 免責事項",
        intro: "プラットフォームは\"現状有姿\"および\"提供可能な状態\"で提供され、いかなる種類の保証もありません。当社は、以下を含むすべての明示的または黙示的な保証を否認します：",
        list: [
          "商品性および特定目的への適合性の保証",
          "正確性、信頼性、または可用性に関する保証",
          "プラットフォームが中断されないまたはエラーがないという保証"
        ]
      },
      {
        heading: "9. 責任の制限",
        intro: "法律で許可される最大限の範囲で、PERPXは以下について責任を負いません：",
        list: [
          "間接的、付随的、特別、または結果的損害",
          "利益、収益、データ、またはビジネス機会の損失",
          "取引損失または清算",
          "お客様のアカウントへの不正アクセスによる損害",
          "第三者サービスまたはブロックチェーンネットワークによって引き起こされた損害"
        ]
      },
      {
        heading: "10. 補償",
        paragraphs: [
          "お客様は、プラットフォームの使用、本規約の違反、または第三者の権利の侵害から生じるあらゆる請求、損害、損失、または費用からPerpXおよびその関連会社を補償し、無害に保つことに同意します。"
        ]
      },
      {
        heading: "11. 規約の変更",
        paragraphs: [
          "当社は、いつでも本規約を変更する権利を留保します。重要な変更については、プラットフォームに更新された規約を掲載することでお知らせします。そのような変更後の継続的な使用は、変更された規約の受諾を構成します。"
        ]
      },
      {
        heading: "12. 終了",
        paragraphs: [
          "当社は、理由の有無にかかわらず、通知の有無にかかわらず、いつでもプラットフォームへのアクセスを一時停止または終了することができます。お客様はいつでもプラットフォームの使用を停止できます。"
        ]
      },
      {
        heading: "13. 紛争解決",
        paragraphs: [
          "本規約またはプラットフォームの使用から生じる紛争は、法律で禁止されている場合を除き、拘束力のある仲裁を通じて解決されるものとします。",
          "お客様は、集団訴訟または集団仲裁に参加する権利を放棄します。"
        ]
      },
      {
        heading: "14. 準拠法",
        paragraphs: [
          "本規約は、法の抵触原則を考慮することなく、適用法に従って解釈され、適用されるものとします。"
        ]
      },
      {
        heading: "15. 可分性",
        paragraphs: [
          "本規約のいずれかの条項が無効または執行不能と判断された場合、残りの条項は完全な効力を持ち続けるものとします。"
        ]
      },
      {
        heading: "16. 連絡先情報",
        paragraphs: [
          "本規約について質問がある場合は、以下までご連絡ください：",
          "メール：legal@perpx.exchange"
        ]
      }
    ]
  },
  cn: {
    title: "服务条款",
    lastUpdated: "最后更新：2026年1月21日",
    sections: [
      {
        heading: "1. 接受条款",
        paragraphs: [
          "通过访问或使用PerpX（\"平台\"），您同意受这些服务条款（\"条款\"）的约束。如果您不同意这些条款，则不得访问或使用该平台。",
          "这些条款构成您与PerpX之间具有法律约束力的协议。请仔细阅读。"
        ]
      },
      {
        heading: "2. 资格和限制",
        paragraphs: [
          "您必须年满18岁才能使用该平台。通过使用该平台，您声明并保证您符合此年龄要求。",
          "该平台不适用于某些受限司法管辖区的个人或实体。如果您位于或是任何此类使用将是非法或被禁止的司法管辖区的公民或居民，则不得使用该平台。",
          "您不得使用任何技术或机制（如VPN）来规避地理限制。"
        ]
      },
      {
        heading: "3. 服务描述",
        intro: "PerpX提供用于永续合约交易的去中心化平台。该平台允许用户：",
        list: [
          "使用杠杆交易永续合约",
          "访问实时市场数据和交易工具",
          "管理交易头寸和投资组合",
          "参与奖励和推荐计划"
        ]
      },
      {
        heading: "4. 用户责任",
        intro: "您同意：",
        list: [
          "提供准确和完整的信息",
          "维护您的钱包和私钥的安全",
          "遵守所有适用的法律和法规",
          "不从事市场操纵或欺诈活动",
          "不将平台用于洗钱或恐怖主义融资",
          "不干扰平台的运营或安全"
        ]
      },
      {
        heading: "5. 交易风险",
        intro: "交易永续合约涉及重大损失风险。您承认并接受：",
        list: [
          "您可能会损失全部或超过您的初始投资",
          "杠杆会放大收益和损失",
          "市场波动可能导致快速和重大损失",
          "过去的表现不保证未来的结果",
          "您对自己的交易决定负全部责任"
        ]
      },
      {
        heading: "6. 费用和收费",
        paragraphs: [
          "该平台可能会对交易和其他服务收取费用。所有适用的费用将在您完成交易之前向您披露。费用可能会根据我们的判断而变更。"
        ]
      },
      {
        heading: "7. 知识产权",
        paragraphs: [
          "该平台的所有内容、功能和功能性均由PerpX拥有，并受知识产权法保护。未经我们明确许可，您不得复制、修改、分发或创建衍生作品。"
        ]
      },
      {
        heading: "8. 免责声明",
        intro: "该平台按\"原样\"和\"可用\"提供，不提供任何形式的保证。我们否认所有明示或暗示的保证，包括：",
        list: [
          "适销性和特定用途适用性的保证",
          "关于准确性、可靠性或可用性的保证",
          "平台将不间断或无错误的保证"
        ]
      },
      {
        heading: "9. 责任限制",
        intro: "在法律允许的最大范围内，PERPX不对以下内容承担责任：",
        list: [
          "任何间接、附带、特殊或后果性损害",
          "利润、收入、数据或商业机会的损失",
          "交易损失或清算",
          "因未经授权访问您的账户而造成的损害",
          "由第三方服务或区块链网络造成的损害"
        ]
      },
      {
        heading: "10. 赔偿",
        paragraphs: [
          "您同意赔偿并使PerpX及其关联公司免受因您使用平台、违反这些条款或侵犯任何第三方权利而产生的任何索赔、损害、损失或费用的损害。"
        ]
      },
      {
        heading: "11. 条款修改",
        paragraphs: [
          "我们保留随时修改这些条款的权利。我们将通过在平台上发布更新的条款来通知您重大变更。在此类变更后继续使用即表示接受修改后的条款。"
        ]
      },
      {
        heading: "12. 终止",
        paragraphs: [
          "我们可以随时暂停或终止您对平台的访问，无论是否有原因或通知。您可以随时停止使用该平台。"
        ]
      },
      {
        heading: "13. 争议解决",
        paragraphs: [
          "因这些条款或您使用平台而产生的任何争议应通过具有约束力的仲裁解决，除非法律禁止。",
          "您放弃参与集体诉讼或集体仲裁的任何权利。"
        ]
      },
      {
        heading: "14. 适用法律",
        paragraphs: [
          "这些条款应根据适用法律进行管辖和解释，而不考虑法律冲突原则。"
        ]
      },
      {
        heading: "15. 可分割性",
        paragraphs: [
          "如果这些条款的任何条款被认定为无效或不可执行，其余条款应继续完全有效。"
        ]
      },
      {
        heading: "16. 联系信息",
        paragraphs: [
          "如果您对这些条款有疑问，请通过以下方式联系我们：",
          "电子邮件：legal@perpx.exchange"
        ]
      }
    ]
  }
};

export default function TermsOfService() {
  const { language } = useLanguage();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const content = termsContent[language as keyof typeof termsContent] || termsContent.en;

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
