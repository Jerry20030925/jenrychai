import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 - Jenrych AI",
  description: "Jenrych AI 隐私政策，了解我们如何收集、使用和保护您的个人信息。",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">隐私政策</h1>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              生效日期：2024年1月1日<br />
              最后更新：2024年1月1日
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. 信息收集</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们收集以下类型的信息：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li><strong>账户信息：</strong>当您注册账户时，我们收集您的邮箱地址、用户名和密码（加密存储）</li>
              <li><strong>对话内容：</strong>您与AI的对话内容，用于提供服务和改善用户体验</li>
              <li><strong>使用数据：</strong>您使用我们服务的方式，包括访问时间、功能使用情况等</li>
              <li><strong>设备信息：</strong>设备类型、操作系统、浏览器类型等技术信息</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. 信息使用</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们使用收集的信息用于：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>提供、维护和改进我们的AI服务</li>
              <li>处理您的请求和提供客户支持</li>
              <li>个性化您的体验和推荐相关内容</li>
              <li>分析使用模式以改善服务质量</li>
              <li>确保服务安全和防止滥用</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. 信息保护</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们采取适当的技术和组织措施来保护您的个人信息：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>使用行业标准的加密技术保护数据传输和存储</li>
              <li>实施访问控制和身份验证机制</li>
              <li>定期进行安全审计和漏洞评估</li>
              <li>对员工进行数据保护培训</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. 信息共享</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们不会出售、交易或转让您的个人信息给第三方，除非：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>获得您的明确同意</li>
              <li>法律要求或法院命令</li>
              <li>保护我们的权利、财产或安全</li>
              <li>与可信的服务提供商合作（在严格的保密协议下）</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. 您的权利</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              您有权：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>访问、更新或删除您的个人信息</li>
              <li>撤回对数据处理的同意</li>
              <li>要求数据可携带性</li>
              <li>限制或反对某些数据处理活动</li>
              <li>提出投诉或要求解释</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. Cookie 和跟踪技术</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们使用Cookie和类似技术来：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>记住您的偏好设置</li>
              <li>分析网站使用情况</li>
              <li>提供个性化内容</li>
              <li>改善用户体验</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. 数据保留</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们仅在必要期间保留您的个人信息：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
              <li>账户信息：在您使用服务期间</li>
              <li>对话记录：根据您的设置，最长保留2年</li>
              <li>使用数据：通常保留12个月</li>
              <li>法律要求：某些信息可能需要更长时间保留</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. 儿童隐私</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们的服务不面向13岁以下的儿童。我们不会故意收集13岁以下儿童的个人信息。
              如果我们发现收集了此类信息，将立即删除。
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">9. 政策更新</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们可能会不时更新本隐私政策。重大变更将通过电子邮件或网站通知您。
              继续使用我们的服务即表示您接受更新后的政策。
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">10. 联系我们</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：
            </p>
            <ul className="list-none mb-6 text-gray-700 dark:text-gray-300">
              <li>邮箱：privacy@jenrychai.com</li>
              <li>地址：中国北京市朝阳区</li>
              <li>电话：400-123-4567</li>
            </ul>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>注意：</strong>本隐私政策仅适用于Jenrych AI服务。如果您通过我们的服务访问第三方网站或服务，
                请查看其各自的隐私政策。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
